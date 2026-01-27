import React, { useRef, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { FoldRenderer } from "./FoldModule";
import { resizeScene } from "./ResizeModule";
import SvgExtrudeMeshes from "./SvgExtrudeMeshes";

import { useUploadTextureStore } from "../../stores/uploadTextureStore";
import { usePointer } from "../../stores/selectionStore";

export default function Model({ progress = 0, scale = 0.05, ...props }) {
  const gltf = useGLTF("/box-sample/150010.glb");

  const groupRef = useRef();
  const sceneRef = useRef(null);
  const sizeCache = useRef(new Map());
  const loggedRef = useRef(false);

  const {
    boxWidth,
    boxLength,
    boxHeight,
    boxDepth,
    setOriginalWidth,
    setOriginalLength,
    setOriginalHeight,
    originalSize,
    resizeRevision
  } = usePointer();

  const { getCurrentTexture } = useUploadTextureStore();

  // ============================================================
  // 1️⃣ TÍNH ORIGINAL SIZE 1 LẦN (từ node O + C2)
  // ============================================================
  useMemo(() => {
    if (!gltf?.scene || loggedRef.current) return;

    let oNode = null;
    let c2Node = null;

    gltf.scene.traverse(child => {
      if (!child.isMesh) return;
      if (child.name.includes("O")) oNode = child;
      if (child.name.includes("C2")) c2Node = child;
    });

    if (oNode && c2Node) {
      oNode.geometry.computeBoundingBox();
      c2Node.geometry.computeBoundingBox();

      const oBox = oNode.geometry.boundingBox;
      const c2Box = c2Node.geometry.boundingBox;

      setOriginalWidth(oBox.max.x - oBox.min.x);
      setOriginalLength(oBox.max.z - oBox.min.z);
      setOriginalHeight(c2Box.max.z - c2Box.min.z);

      console.log("📦 originalSize:", {
        w: oBox.max.x - oBox.min.x,
        l: oBox.max.z - oBox.min.z,
        h: c2Box.max.z - c2Box.min.z
      });

      loggedRef.current = true;
    }
  }, [gltf, setOriginalWidth, setOriginalLength, setOriginalHeight]);

  // ============================================================
  // 2️⃣ RESIZE SCENE (PURE)
  // ============================================================
  const resizedScene = useMemo(() => {
    if (!gltf?.scene) return null;

    const key = `${boxWidth}-${boxLength}-${boxHeight}-${boxDepth}-${resizeRevision}`;

    return resizeScene(
      gltf.scene,
      boxWidth,
      boxLength,
      boxHeight,
      sizeCache,
      key
    );
  }, [gltf, boxWidth, boxLength, boxHeight, boxDepth]);

  // ============================================================
  // 3️⃣ CLONE → SCENE CHO FOLD
  // ============================================================
  useEffect(() => {
    if (!resizedScene) return;

    sceneRef.current = resizedScene.clone(true);
  }, [resizedScene]);

  // ============================================================
  // 4️⃣ RENDER
  // ============================================================
  return (
    <group ref={groupRef} {...props} scale={scale} dispose={null}>
      {sceneRef.current && (
        <FoldRenderer
          sceneClone={sceneRef.current}
          progress={progress}
          getCurrentTexture={getCurrentTexture}
          boxSize={{
            x: boxWidth,
            y: boxHeight,
            z: boxLength
          }}
          originalSize={originalSize}
        />
      )}
      <SvgExtrudeMeshes svgPath="/box-sample/150010.svg" />
    </group>
  );
}
