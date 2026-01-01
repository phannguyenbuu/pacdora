import * as THREE from "three";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useToggleRoomStore } from "../../stores/toggleRoomStore";

import gsap from "gsap";
import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, Box, useGLTF, ContactShadows, useTexture, Decal } from '@react-three/drei';
import PointerHighlight from "../PointerHightlight";

import { useSelection, usePointer } from "../../stores/selectionStore";

const planeZ = 0.001;

const Plane = ({ row, column, position, planeDepth, planeWidth, cost,
  setPointerPosition, modelFile, data}) => {
    const {addedHighlights, setAddedHighlights} = usePointer();
  const { setMessage, currentLibNodeSelection, 
    setCurrentLibNodeSelection, 
    currentSelection, setCurrentSelection,
  } = useSelection();

  const {directionAxis, setDirectionAxis, getResult} = usePointer();


  const meshRef = useRef();
  const {pointer, setPointer, positionPointer, isMoving, setIsMoving } = usePointer();
  const [hovered, setHovered] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const { isDarkRoom, isTransitioning } = useToggleRoomStore();
  const {rotationIndex} = usePointer();

  useEffect(() => {

    // setMessage("Parse data");
    if(!data || !data.zone || data.zone.length !== 4) return;
    
    if(!(row >= data.zone[0] && row <= data.zone[2] 
      && column >= data.zone[1] && column <= data.zone[3] )
    )
    {
      // setMessage(`Vật thể không nằm trong phòng ${data.zone} ${row} ${column}`);
    }else{
      // setMessage(`Vị trí thích hợp ${rotationIndex} ${directionAxis}`);
    }
    
    },[hovered]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#ffffff",
      emissive: "#ffffff",
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0,
    });
  }, []);
  

  useEffect(() => {
    if (!meshRef.current) return;

    const material = meshRef.current.material;
    const targetColor = isDarkRoom ? "#ffffff" : "#000000";
    const targetColorObj = new THREE.Color(targetColor);

    gsap.to(material.color, {
      r: targetColorObj.r,
      g: targetColorObj.g,
      b: targetColorObj.b,
    });
    gsap.to(material.emissive, {
      r: targetColorObj.r,
      g: targetColorObj.g,
      b: targetColorObj.b,
    });
  }, [isDarkRoom]);

  useFrame(() => {
    if (!meshRef.current) return;
    const targetOpacity = hovered ? 0.8 : 0;
    let lerpFactor = hovered ? 0.1 : 0.03;
    if (isTransitioning) {
      lerpFactor = 0.15;
    }
    setOpacity(THREE.MathUtils.lerp(opacity, targetOpacity, lerpFactor));
    meshRef.current.material.opacity = opacity;
    meshRef.current.emissiveIntensity = hovered ? 1.5 : 0.8;


    // const bbox = new THREE.Box3().setFromObject(meshRef.current);
    // console.log("Point Box Min:", bbox.min);
    // console.log("Point Box Max:", bbox.max);
  });

  return (
    
    <mesh
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
      onPointerMove={() => {
        // if (isTransitioning) return;
        // setMessage(`${row}-${column}-${selectedRef}:${position}`);
        // if (selectedRef) {
        //   selectedRef.current.position.set(position.x, position.y, position.z);
        // }

        setPointerPosition(position);
        setHovered(true);
      }}
      onPointerOut={() => {
        setHovered(false);
      }}
      onClick={() => {
        // setReleaseMouse();
        if(currentLibNodeSelection)
        {
          setAddedHighlights((current) => {
            // const index = current.findIndex(
            //   (item) =>
            //     Math.abs(item.position[0] - position[0]) < 0.001 &&
            //     Math.abs(item.position[1] - position[1]) < 0.001 &&
            //     Math.abs(item.position[2] - position[2]) < 0.001
            // );

            // if (index !== -1) {
            //   const newHighlights = [...current];
            //   newHighlights[index] = {
            //     ...newHighlights[index],
            //     data: data,
            //     rotationIndex: rotationIndex,
            //   };
            //   setPointer(current);
              
            //   return newHighlights;
            // } else {
              setMessage(`Đã đặt vào phòng`);
              const uniqueId = `${data.name}-${Date.now()}`;

              const newList = [...current, { id: uniqueId, position, cost,
                modelFile, data, rotationIndex: 0 }];
              setPointer(newList[newList.length - 1]);
              return newList;
          });
          
          // setPointer(null);
          setCurrentLibNodeSelection(null);
        }

        setPointer(null);
        setCurrentSelection(null);
        setCurrentLibNodeSelection(null);
        
      }}


    >
      <planeGeometry args={[planeDepth, planeWidth]} />
    </mesh>
  );
};

const GridPlanes = ({
  position,
  rows,
  columns,
  planeWidth,
  planeDepth,
  spacing,
  ref,
}) => {
  
  const { currentLibNodeSelection, setCurrentLibNodeSelection, currentSelection  } = useSelection();
  const { setPointer} = usePointer();
  const {addedHighlights, setAddedHighlights} = usePointer();
  const selectedRef = useRef();
  const [pointerPosition, setPointerPosition] = useState([0, 0, 0]);

  const [selectedHighlightId, setselectedHighlightId] = useState(null);
  const [movingId, setMovingId] = useState(null);

  const [currentModelFile, setCurrentModelFile] = useState(null);
  const [rotationIndex, setRotationIndex] = useState(0);
  // const [addedHighlights, setAddedHighlights] = useState([]);

  const onSelectHighlight = (highlight) => {
    console.log(highlight.id, movingId);
    if (movingId === item.id) {
      setMovingId(null);  // Click lần nữa để thả (dừng di chuyển)
    } else {
      setMovingId(item.id);    // Bắt đầu di chuyển đối tượng này
    }
    // const highlight = addedHighlights[index];

    // Xóa phần tử khỏi danh sách
    // setAddedHighlights((prev) => prev.filter((item) => item !== highlight));

    // Lưu lại ở pointer chính các giá trị để chỉnh sửa
    setselectedHighlightId(highlight.id);
    // setPointerPosition(highlight.position);
    // setCurrentModelFile(highlight.modelFile);
    setRotationIndex(highlight.rotationIndex || 0);
  }



  const gridWidth = columns * (planeWidth + spacing) - spacing;
  const gridDepth = columns * (planeDepth + spacing) - spacing;

  const startX = planeWidth / 2 - gridWidth / 2;
  const startZ = planeDepth / 2 - gridDepth / 2;

  useEffect(() => {
    if (selectedRef.current) {
      setPointer(selectedRef.current);
    }
  }, [selectedRef.current, currentLibNodeSelection]);


  return (
    <>
      <group ref={ref}>
        {Array.from({ length: rows }).map((_, row) =>
          Array.from({ length: columns }).map((_, column) => {
            const x = startX + column * (planeWidth + spacing);
            const z = startZ + row * (planeDepth + spacing);
            return (
              <Plane
                key={`plane-${row}-${column}`}
                id={`plane-${row}-${column}`}
                row = {row} column={column}
                planeDepth={planeDepth}
                planeWidth={planeWidth}
                position={[x, planeZ, z]}
                setPointerPosition={setPointerPosition}
                // setAddedHighlights={setAddedHighlights}
                modelFile={currentLibNodeSelection?.file}
                data={currentLibNodeSelection}
                cost={currentLibNodeSelection?.cost}
                // selectedRef={selectedRef}
              />
            );
          })
        )}

        {addedHighlights.map((data, index) => (
          <PointerHighlight key={index} data={data} 
            // id={item.id} pointer={item.position} modelFile={item.modelFile} 
            isSelected={selectedHighlightId === data.id}
            isMoving={movingId === data.id}
            setMovingId={setMovingId}
            // rotationIndex={data.rotationIndex}
            onClick={() => onSelectHighlight(data)}
          />
        ))}


      </group>

      
    </>
  );
};

export default GridPlanes;
