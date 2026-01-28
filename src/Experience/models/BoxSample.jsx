import React, { useRef } from "react";
import SvgExtrudeMeshes from "./SvgExtrudeMeshes";

export default function Model({ progress = 0, scale = 0.05, ...props }) {
  const groupRef = useRef();

  return (
    <group ref={groupRef} {...props} scale={scale} dispose={null}>
      <SvgExtrudeMeshes svgPath="/box-sample/150010.svg" progress={progress} />
    </group>
  );
}
