import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useUploadTextureStore } from "../../../stores/uploadTextureStore";

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

  const { getCurrentTexture } = useUploadTextureStore();

useFrame(() => {
  if (!group.current || !gltf.scene) return;

  // Thêm vào useFrame, sau apply texture


  group.current.clear();
  const sceneClone = gltf.scene.clone(true);


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
            // console.log(`🎨 Applied to: "${child.name}"`);
          }
        }
      });
    }

    // if (texture) {
    //   console.log('🎨 Applied texture to', sceneClone.children.length, 'meshes');
    // }

  
  // 🔥 8-STAGE ULTRA-DETAILED PROGRESS
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

  group.current.add(sceneClone);
});







  return <group ref={group} {...props} scale={scale} dispose={null} />;
}
