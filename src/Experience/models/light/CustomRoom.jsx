import React, {useEffect, useRef, useState, useMemo } from "react";
import { useGLTF, useTexture  } from "@react-three/drei";
import { convertMaterialsToBasic } from "../../utils/convertToBasic";
import * as THREE from 'three';
import { ContactShadows } from '@react-three/drei';
import { usePointer } from "../../../stores/selectionStore.jsx";
import { OBJExporter } from "../../ObjExporter";

import Wall from "./Wall.jsx";
import Door from "./Door.jsx";
import Floor from "./Floor.jsx";
import Curtain from "./Curtain.jsx";

export default function Model({ ...props }) {
  const lightRefs = useRef([]);
  const targetRefs = useRef([]);
  const {wallType01, wallType02, wallMtl01, wallMtl02, floorMtl,
    roomWidth, roomLength, roomHeight, roomDoor, setRoomDoor} = usePointer();
    const [doorInfor, setRoomInfor] = useState({x:0,z:0,r:0});
  const subw = 1.28;

  useEffect(()=>{
      const w = roomWidth - 0.3 * roomWidth/5;
      const l = roomLength - 0.3 * roomLength/5;
      // Chu vi hình chữ nhật
      const perimeter = 2 * (w + l);
  
      // Khoảng cách theo chu vi ứng với roomDoor
      const dist = roomDoor * perimeter;
  
      // Tính tọa độ dọc theo chu vi hình chữ nhật
      let x = 0, z = 0, rotation = 0;
  
      if (dist <= w) {
          // Đoạn trên cạnh dưới
          x = dist;
          z = 0;
          rotation = 0; // quay hướng sang phải
      } else if (dist <= w + l) {
          // cạnh phải lên
          x = w;
          z = dist - w;
          rotation = 90; // quay lên trên
      } else if (dist <= 2 * w + l) {
          // cạnh trên sang trái
          x = w - (dist - (w + l));
          z = l;
          rotation = 180; // quay sang trái
      } else {
          // cạnh trái xuống
          x = 0;
          z = l - (dist - (2 * w + l));
          rotation = 270; // quay xuống dưới
      }
  
      setRoomInfor({x:z - l/2,z:x - w/2,r:rotation / 180 * Math.PI + Math.PI/2});
    },[roomWidth,roomLength, roomDoor]);
  
  useEffect(() => {
    if (lightRefs.current.length && targetRefs.current.length) {
      lightRefs.current.forEach((light, i) => {
        if (light && targetRefs.current[i]) {
          light.target = targetRefs.current[i];
          light.target.updateMatrixWorld();
        }
      });
    }
  }, []);

  let positionsY = [-roomWidth / 3, 0, roomWidth / 3];
  let positionsX = [-roomLength / 3, 0, roomLength / 3];


  useEffect(() => {
    lightRefs.current.forEach((light, i) => {
      if (light && targetRefs.current[i]) {
        light.target = targetRefs.current[i];
        light.target.updateMatrixWorld();
      }
    });
  }, [roomWidth, roomLength]);


  const wallObjects1 = useMemo(() => (
    <group>
      <Curtain 
        key="curtain-01"  uniqueKey="curtain-01"
        position={[-roomLength / 2, 0, 0]} 
        rotation={[0, Math.PI / 2, 0]} 
        scale={[roomWidth / 5, 1, 1]} 
        visible={wallType01?.type === "glasswall"}
        
      />
      <Wall uvs = {[roomWidth,1,roomHeight]}
        key="wall-01" 
        width={5} height={3.6} length={0.2}
        position={[-roomLength / 2, 0, 0]} 
        rotation={[0, Math.PI / 2, 0]} 
        scale={[roomWidth / 5, 1, 1]} 
        visible={wallType01?.type !== "glasswall"}
        mtl = {wallMtl01}
      />
    </group>
  ), [wallMtl01, wallType01?.type, roomWidth, roomHeight, roomLength]);

  const wallObjects2 = useMemo(() => (
    <group>
      <Curtain 
        key="curtain-02"  uniqueKey="curtain-02"
        position={[0, 0, -roomWidth / 2]} 
        scale={[roomLength/ 5,1,1]} 
        visible={wallType02?.type === "glasswall"}
      />
      <Wall uvs = {[roomWidth,1,roomHeight]}
        key="wall-02" 
        width={5} height={3.6} length={0.2}
        position={[0, 0, -roomWidth / 2]} 
        scale={[roomLength/ 5,1,1]} 
        visible={wallType02?.type !== "glasswall"}
        mtl = {wallMtl02}
      />
    </group>
  ), [wallMtl02, wallType02?.type, roomWidth, roomLength, roomHeight]);  // ✅ Dependencies cụ thể

  const floorObject = useMemo(() => (
    <Wall uvs = {[roomHeight,roomWidth,roomLength]}
            width={roomLength} height={0.2} length={roomWidth}
          position={[0, -0.2, 0]} mtl = {floorMtl}/>
  ),[floorMtl, roomWidth, roomLength, roomHeight]);

  return (
    <group {...props}>
      {wallObjects2}
      {wallObjects1}
      {floorObject}
      
      <Door position={[doorInfor.x, 0, doorInfor.z]} 
        rotation={[0, doorInfor.r, 0]} scale={[-1, 1, 1]} />

      {positionsX.map((x, i) =>
        positionsY.map((y, j) => {
          const index = i * positionsY.length + j;
          return (
            <React.Fragment key={`${x}-${y}`}>
              <spotLight
                ref={(el) => (lightRefs.current[index] = el)}
                color={0xffdea6}
                position={[x, 3, y]}
                angle={Math.PI / 3}
                penumbra={0.0001}
                intensity={5}
                castShadow
              />
              <object3D ref={(el) => (targetRefs.current[index] = el)} position={[x, 0, y]} />
            </React.Fragment>
          );
        })
      )}
    </group>
  );
}
