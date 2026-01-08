import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useUploadTextureStore } from "../../../stores/uploadTextureStore";
import { usePointer, useSelection } from "../../../stores/selectionStore";
import resizeConfig from "../../../json/pointConfig/150010.json";

const isChild = (child, s) => {
  return child.name === s || child.name.startsWith(s + "_");
};



const createFoldGroup = (sceneClone, config, progress, axis = 0, reversed = false) => {
  const meshes = { 
    chains: { left: [], right: [] },  
    pivot: [],
  };
  let pivotWorldPos = null;

  const prefix = config.prefix;
  const pivotPrefix = config.pivot;
  const isComplexD = config.isComplexD || false;

  

  sceneClone.traverse((child) => {
    if (child.isMesh) {
      if (isComplexD) {
        // D CHAINS: D1→D2→D3 & D7→D6→D5
        if (isChild(child, prefix + '1') || isChild(child, prefix + '2') || isChild(child, prefix + '3')) {
          meshes.chains.left.push(child);
        }
        if (isChild(child, prefix + '5') || isChild(child, prefix + '6') || isChild(child, prefix + '7')) {
          meshes.chains.right.push(child);
        }
        if (isChild(child, pivotPrefix)) {  // D4
          meshes.pivot.push(child);
          if (!pivotWorldPos) pivotWorldPos = child.getWorldPosition(new THREE.Vector3()).clone();
        }
      } else {
        // Standard A,B,C
        if (isChild(child, prefix + '1')) meshes.chains.left.push(child);
        if (isChild(child, pivotPrefix)) {
          meshes.pivot.push(child);
          if (!pivotWorldPos) pivotWorldPos = child.getWorldPosition(new THREE.Vector3()).clone();
        }
        if (isChild(child, prefix + '3')) meshes.chains.right.push(child);
      }
    }
  });

  const foldGroup = new THREE.Group();
  
  // Add tất cả với relative position
  [...meshes.chains.left, ...meshes.chains.right].forEach(mesh => {
    if (mesh && pivotWorldPos) {
      const meshWorldPos = mesh.getWorldPosition(new THREE.Vector3()).clone();
      mesh.position.copy(meshWorldPos.sub(pivotWorldPos));
      foldGroup.add(mesh);
    }
  });

  // 🔥 D4 PIVOT - KHÔNG ADD VÀO GROUP ROTATION
  meshes.pivot.forEach(pivotMesh => {
    if (pivotMesh && pivotWorldPos) {
      pivotMesh.position.set(0, 0, 0);  // Center trong group
      foldGroup.add(pivotMesh);
    }
  });

  if (pivotWorldPos) foldGroup.position.copy(pivotWorldPos);
  // 🔥 FIXED FULL ANGLE
const FULL_ANGLE = Math.PI / 2;

// ULTRA FAST CHAINS - xong ở 15% (progress * 6.67 = 1)
const chainProgress = Math.min(progress * 6.67, 1);
meshes.chains.left.forEach(mesh => {
  mesh.rotation.z = -chainProgress * FULL_ANGLE;
});
meshes.chains.right.forEach(mesh => {
  mesh.rotation.z = chainProgress * FULL_ANGLE;
});

// SLOW GROUP - bắt đầu 25%, easing mượt
const groupProgress = Math.max(0, (progress - 0.25) / 0.75);
if(axis == 1)
  foldGroup.rotation.z = reversed ? -groupProgress * FULL_ANGLE : groupProgress * FULL_ANGLE;
else
  foldGroup.rotation.x = reversed ? -groupProgress * FULL_ANGLE : groupProgress * FULL_ANGLE;

  return foldGroup;
};






// 🔥 HELPER: Collect meshes by name list (optimized)
const collectMeshes = (scene, nameList) => {
  const result = [];
  
  scene.traverse((child) => {
    if (child.isMesh && nameList.some(name => isChild(child, name))) {
      result.push(child);
    }
  });
  
  return result;
};








const createThreeStageFoldGroup = (sceneClone, prefixList, progress, reversed = false) => {
  const meshesList = prefixList.map(prefix =>
    collectMeshes(sceneClone, [prefix + '1', prefix + '2', prefix + '3'])
  );

  const FULL_ANGLE = Math.PI / 2;
  const dir = reversed ? 1 : -1;

  // Main group
  const mainGroup = new THREE.Group();
  meshesList.flat().forEach(mesh => mainGroup.add(mesh));

  // dPivot setup
  const dPivot = new THREE.Group();
  dPivot.position.set(reversed ? 6.22 : -6.22, 0, 2.29);
  const x = reversed ? -1.065 : 1.065;
  dPivot.position.add(new THREE.Vector3(x, 0, 0));
  dPivot.add(mainGroup);
  mainGroup.position.set(-x, 0, 0);

  // 🔥 STAGE 1: D123 (0-30%) - xong mới stage 2
  const p1 = Math.min(progress / 0.3, 1);
  dPivot.rotation.z = dir * p1 * FULL_ANGLE;

  // D12 folding
  const d12Meshes = collectMeshes(mainGroup, [prefixList[0] + '1', prefixList[0] + '2']);
  if (d12Meshes.length > 0) {
    const d12Bbox = new THREE.Box3();
    d12Meshes.forEach(mesh => {
      mesh.updateMatrixWorld();
      d12Bbox.expandByObject(mesh);
    });
    const d12Pivot = new THREE.Vector3(reversed ? d12Bbox.min.x : d12Bbox.max.x, d12Bbox.min.y, 0);

    const d12RotationGroup = new THREE.Group();
    d12RotationGroup.position.copy(d12Pivot);
    mainGroup.add(d12RotationGroup);

    d12Meshes.forEach(mesh => {
      const meshLocalPos = mesh.position.clone();
      mesh.position.copy(meshLocalPos.sub(d12Pivot));
      d12RotationGroup.add(mesh);
    });

    // 🔥 STAGE 2: D12 (30-70%) - D12 xong mới D1
    const p2 = Math.max(0, Math.min((progress - 0.3) / 0.4, 1));
    d12RotationGroup.rotation.z = dir * p2 * FULL_ANGLE;

    // D1 folding  
    const d1Meshes = collectMeshes(d12RotationGroup, [prefixList[0] + '1']);
    if (d1Meshes.length > 0) {
      const d1Bbox = new THREE.Box3();
      d1Meshes.forEach(mesh => {
        mesh.updateMatrixWorld();
        d1Bbox.expandByObject(mesh);
      });
      const xOffset = reversed ? -0.085 : 0.085;
      const d1PivotPos = new THREE.Vector3(reversed ? d1Bbox.min.x - xOffset : d1Bbox.max.x - xOffset, d1Bbox.min.y, 0);

      const d1RotationGroup = new THREE.Group();
      d1RotationGroup.position.copy(d1PivotPos);
      d12RotationGroup.add(d1RotationGroup);

      d1Meshes.forEach(mesh => {
        const meshLocalPos = mesh.position.clone();
        mesh.position.copy(meshLocalPos.sub(d1PivotPos));
        mesh.position.x -= xOffset;
        d1RotationGroup.add(mesh);
      });

      // 🔥 STAGE 3: D1 (70-100%) - CHẬM NHẤT, CUỐI CÙNG
      const p3 = Math.max(0, Math.min((progress - 0.7) / 0.3, 1));
      d1RotationGroup.rotation.z = dir * p3 * FULL_ANGLE;
    }
  }

  return dPivot;
};

export default function Model({ progress = 0, scale = 0.05, ...props }) {
  const gltf = useGLTF("/box-sample/150010.glb");
  const group = useRef();
  const sizeCache = useRef(null);
  const {message, setMessage} = useSelection();

  const { boxWidth, boxLength, boxHeight, boxDepth  } = usePointer();

  const { getCurrentTexture } = useUploadTextureStore();

 const positionToText = (child) => {
  const positions = child.geometry.attributes.position.array;

  let output = `{\n`;
  output += `"name": "${child.name}",\n`;
  output += `"points": [\n`;

  for (let i = 0; i < positions.length; i += 3) {
    output += `  [${ 
      positions[i].toFixed(2)
    }, ${
      positions[i + 1].toFixed(2)
    }, ${
      positions[i + 2].toFixed(2)
    }]`;

    if (i < positions.length - 3) output += ',';
    output += '\n';
  }

  output += `]\n}`;
  return output;
};

const calculateOriginalBBox = (gltf) => {
  const box = new THREE.Box3();
  
  gltf.scene.traverse((child) => {
    if (child.isMesh && child.geometry) {
      child.geometry.computeBoundingBox();
      box.union(child.geometry.boundingBox);
    }
  });
  
  return box;
};

// Sử dụng trong component
const originalBBox = useMemo(() => {
  return calculateOriginalBBox(gltf); // Tính từ GLB thực tế
}, [gltf]);

const getRuleForChild = (childName, resizeRules) => {
  // 🔥 TỰ ĐỘNG: B1_1, B1_2 → dùng rule của B1
  const baseName = childName.replace(/_[1-2]$/, '');
  if (baseName !== childName && resizeRules[baseName]) {
    return resizeRules[baseName];  // ← Auto inherit từ parent!
  }
  
  // Direct rule
  return resizeRules[childName] || null;
};

const applyResizeRule = useCallback((geometry, childName, boxWidth, boxLength, boxHeight, resizeRules) => {
  const rule = getRuleForChild(childName, resizeRules);
  
  if (!rule) {
    // Fallback: dùng default resize
    return dynamicResizeGeometry(geometry, boxWidth, boxLength, boxHeight);
  }

  const positions = [...geometry.attributes.position.array];
  const bboxSize = {
    x: originalBBox.max.x - originalBBox.min.x,
    z: originalBBox.max.z - originalBBox.min.z,
    y: originalBBox.max.y - originalBBox.min.y
  };

  for (let i = 0; i < positions.length; i += 3) {
    let x = positions[i], y = positions[i + 1], z = positions[i + 2];
    
    if (rule.type === "full") {
      // Áp dụng rule B1 cho B1, B1_1, B1_2
      const deltaX = (boxWidth - bboxSize.x);
      if (rule.direction === "left") {
        x -= deltaX * rule.deltaMultiplier;
      } else {
        x += deltaX * rule.deltaMultiplier;
      }
    }
    
    positions[i] = x; positions[i + 1] = y; positions[i + 2] = z;
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}, [originalBBox]);




useEffect(() => {
  const bbox = calculateOriginalBBox(gltf);
  
  const bboxInfo = {
    sizeX: (bbox.max.x - bbox.min.x).toFixed(3),
    sizeZ: (bbox.max.z - bbox.min.z).toFixed(3), 
    sizeY: (bbox.max.y - bbox.min.y).toFixed(3),
    min: {
      x: bbox.min.x.toFixed(3),
      y: bbox.min.y.toFixed(3),
      z: bbox.min.z.toFixed(3)
    },
    max: {
      x: bbox.max.x.toFixed(3),
      y: bbox.max.y.toFixed(3),
      z: bbox.max.z.toFixed(3)
    }
  };
  
  setMessage(JSON.stringify(bboxInfo, null, 2));
}, [gltf]);


  useEffect(() => {
  if (!group.current || !gltf.scene) return;

  let msg = `[\n`;
  let first = true;

  const baseScene = gltf.scene.clone(true);
  baseScene.traverse(child => {
    if (child.isMesh) {
      if (!first) msg += ',\n';
      msg += positionToText(child);
      first = false;
    }
  });

  msg += `\n]`;

  // setMessage(msg);
}, [boxWidth, boxLength, boxHeight]);


  const foldAllStages = (sceneClone) => {
    const stage1 = Math.min(progress / 0.125, 1);  // 0-12.5%: sideF
    const stage2 = Math.max(0, Math.min((progress - 0.125) / 0.125, 1));  // 12.5-25%: sideC
    const stage3 = Math.max(0, Math.min((progress - 0.25) / 0.125, 1));   // 25-37.5%: D3+D2
    const stage4 = Math.max(0, Math.min((progress - 0.375) / 0.125, 1));  // 37.5-50%: E3+E2
    const stage5 = Math.max(0, Math.min((progress - 0.50) / 0.125, 1));   // 50-62.5%: D1
    const stage6 = Math.max(0, Math.min((progress - 0.625) / 0.125, 1));  // 62.5-75%: E1
    const stage7 = Math.max(0, Math.min((progress - 0.75) / 0.125, 1));   // 75-87.5%: sideB ✅
    const stage8 = Math.max(0, Math.min((progress - 0.875) / 0.125, 1));  // 87.5-100%: sideA ✅

    // 🔥 GROUPS với CORRECTED STAGE PROGRESS
    const lidGroupA = createFoldGroup(sceneClone, { prefix: 'A', pivot: 'A2' }, stage8); // Stage 8: sideA
    const sideGroupB = createFoldGroup(sceneClone, { prefix: 'B', pivot: 'B2' }, stage7); // Stage 7: sideB
    const sideGroupC = createFoldGroup(sceneClone, { prefix: 'C', pivot: 'C2' }, stage2); // Stage 2
    const sideGroupF = createFoldGroup(sceneClone, { prefix: 'F', pivot: 'F2' }, stage1, 0, true); // Stage 1

    const d123Folded = createThreeStageFoldGroup(sceneClone, ['D'], stage5);
    const e123Folded = createThreeStageFoldGroup(sceneClone, ['E'], stage6, true);

    // NESTING
    sideGroupB.add(lidGroupA);
    sideGroupC.add(sideGroupB);
    lidGroupA.position.z += 0.55;
    sideGroupB.position.z -= 0.55;

    // ADD TẤT CẢ
    [sideGroupF, sideGroupC, d123Folded, e123Folded].forEach(group => {
      if (group) sceneClone.add(group);
    });
  }


  const setTexture = (sceneClone) => {
    const texture = getCurrentTexture();
    
      if (texture) {
        sceneClone.traverse((child) => {
          if (child.isMesh) {
            const nameOK = child.name.includes('_1');
          
            if (nameOK) {
              child.material = child.material.clone();
              child.material.map = texture;
              child.material.needsUpdate = true;
              child.material.envMapIntensity=1.5;
            }
          }
        });
      }

    
  }


  const showBBox = () => {
    const tempScene = gltf.scene.clone(true);
  tempScene.traverse(child => {
    if (child.isMesh) {
      child.geometry = dynamicResizeGeometry(
        child.geometry.clone(),
        boxWidth, boxLength, boxHeight
      );
    }
  });

  // Tính bbox MỚI sau resize
  const newBBox = calculateOriginalBBox({ scene: tempScene });
  
  const bboxInfo = {
    timestamp: Date.now(),
    inputSizes: { boxWidth: boxWidth.toFixed(3), boxLength: boxLength.toFixed(3), boxHeight: boxHeight.toFixed(3) },
    originalSize: {
      x: (originalBBox.max.x - originalBBox.min.x).toFixed(3),
      z: (originalBBox.max.z - originalBBox.min.z).toFixed(3),
      y: (originalBBox.max.y - originalBBox.min.y).toFixed(3)
    },
    newSize: {
      x: (newBBox.max.x - newBBox.min.x).toFixed(3),
      z: (newBBox.max.z - newBBox.min.z).toFixed(3),
      y: (newBBox.max.y - newBBox.min.y).toFixed(3)
    },
    min: {
      x: newBBox.min.x.toFixed(3),
      y: newBBox.min.y.toFixed(3),
      z: newBBox.min.z.toFixed(3)
    },
    max: {
      x: newBBox.max.x.toFixed(3),
      y: newBBox.max.y.toFixed(3),
      z: newBBox.max.z.toFixed(3)
    }
  };
  
  setMessage(JSON.stringify(bboxInfo, null, 2));
  }


const dynamicResizeGeometry = useCallback((geometry, boxWidth, boxLength, boxHeight) => {
  // Default resize cho meshes không có rule đặc biệt
  if (!geometry?.attributes?.position) return geometry;
  
  const positions = [...geometry.attributes.position.array];
  const bboxSize = {
    x: originalBBox.max.x - originalBBox.min.x,
    z: originalBBox.max.z - originalBBox.min.z,
    y: originalBBox.max.y - originalBBox.min.y
  };

  for (let i = 0; i < positions.length; i += 3) {
    let x = positions[i], y = positions[i + 1], z = positions[i + 2];
    
    // Default: chia đều theo sign
    const deltaX = (boxWidth - bboxSize.x) / 2;
    x > 0 ? x += deltaX : x -= deltaX;
    
    // const deltaZ = (boxLength - bboxSize.z) / 2;
    // z > 0 ? z += deltaZ : z -= deltaZ;
    
    // const deltaY = boxHeight - bboxSize.y;
    // y > 0 && (y += deltaY);
    
    positions[i] = x; positions[i + 1] = y; positions[i + 2] = z;
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}, [originalBBox]);









  useFrame(() => {
  group.current.clear();

  const sizeKey = `${boxWidth.toFixed(2)}-${boxLength.toFixed(2)}-${boxHeight.toFixed(2)}-${boxDepth.toFixed(2)}`;
  let baseScene = sizeCache.current?.scene;
  
  if (!baseScene || sizeCache.current.key !== sizeKey) {
    // 🔥 1. Clone GỐC (chưa resize)
    const originalScene = gltf.scene.clone(true);
    
    // 🔥 2. TÍNH PIVOT POSITIONS TRƯỚC (lưu vào cache)
    const pivotPositions = {};
    originalScene.traverse(child => {
      if (child.isMesh && child.name.includes('2')) { // A2,B2,C2...
        child.updateMatrixWorld(true);
        pivotPositions[child.name] = child.getWorldPosition(new THREE.Vector3()).clone();
      }
    });
    
    // 🔥 3. RESIZE geometries
    baseScene = originalScene.clone(true);
    baseScene.traverse(child => {
      if (child.isMesh) {
         child.geometry = applyResizeRule(
            child.geometry.clone(),
            child.name,  // "B1", "B1_1", "A3",...
            boxWidth, boxLength, boxHeight,
            resizeConfig.resizeRules
          );
      }
    });
    
    // 🔥 4. Lưu pivot positions vào cache
    sizeCache.current = { 
      key: sizeKey, 
      scene: baseScene,
      pivotPositions // ← QUAN TRỌNG!
    };
  }

  const sceneClone = baseScene.clone(true);
  setTexture(sceneClone);
  // 🔥 5. TRUYỀN pivotPositions vào foldAllStages
  foldAllStages(sceneClone, sizeCache.current.pivotPositions);
  group.current.add(sceneClone);

    showBBox();
});

  

  return <group ref={group} {...props} scale={scale} dispose={null} />;
}
