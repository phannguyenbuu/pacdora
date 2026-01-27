import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import Scene from "./Scene";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls, Environment } from "@react-three/drei";

import { useToggleRoomStore } from "../stores/toggleRoomStore";
import { useResponsiveStore } from "../stores/useResponsiveStore";
import { useExperienceStore } from "../stores/experienceStore";

import { notification } from 'antd';

const Experience = ({foldProgress}) => {
  const [, contextHolder] = notification.useNotification();
  const cameraRef = useRef();
  const pointerRef = useRef({ x: 0, y: 0 });
  const { isExperienceReady } = useExperienceStore();
  const { isMobile } = useResponsiveStore();

  const { isDarkRoom, setIsBeforeZooming, setIsTransitioning } =
    useToggleRoomStore();

  const cameraPositions = {
    dark: {
      position: [
        12,
        10,
        10,
      ],
    },
    light: {
      position: [3.2, 16.2, 21.6],
    },
  };

  
  

  const zoomValues = {
    default: isMobile ? 74 : 80,
    animation: isMobile ? 65 : 110,
  };


  useEffect(() => {
    if (!cameraRef.current) return;

    const targetPosition = isDarkRoom
      ? cameraPositions.dark.position
      : cameraPositions.light.position;

    gsap.set(cameraRef.current.position, {
      x: targetPosition[0],
      y: targetPosition[1],
      z: targetPosition[2],
    });
  }, [isExperienceReady]);

  useEffect(() => {
    if (!cameraRef.current) return;

    zoomValues.default = isMobile ? 74 : 135;
    zoomValues.animation = isMobile ? 65 : 110;

    cameraRef.current.zoom = zoomValues.default;
    cameraRef.current.updateProjectionMatrix();
  }, [isMobile]);

  useEffect(() => {
    if (!cameraRef.current) return;

    const targetPosition = isDarkRoom
      ? cameraPositions.dark.position
      : cameraPositions.light.position;

    const t1 = gsap.timeline({
      onComplete: () => {
        setIsTransitioning(false);
      },
    });
    t1.to(cameraRef.current, {
      zoom: zoomValues.animation,
      duration: 1,
      ease: "power3.out",
      onStart: () => {
        setIsTransitioning(true);
        setIsBeforeZooming(true);
      },
      onUpdate: () => {
        cameraRef.current.updateProjectionMatrix();
      },
    })
      .to(cameraRef.current.position, {
        x: targetPosition[0],
        y: targetPosition[1],
        z: targetPosition[2],
        duration: 1.5,
        ease: "power3.out",
      })
      .to(cameraRef.current, {
        zoom: zoomValues.default,
        duration: 1,
        ease: "power3.out",
        onStart: () => {
          setIsBeforeZooming(false);
        },
        onUpdate: () => {
          cameraRef.current.updateProjectionMatrix();
        },
      });
  }, [isDarkRoom]);

  useEffect(() => {
    const onPointerMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;

      pointerRef.current = { x, y };
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 1) {
        pointerRef.current.x =
          (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        pointerRef.current.y =
          -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    };

    // window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("touchmove", onTouchMove);

    return () => {
      // window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  });


  return (
    <>
    {contextHolder}
      <Canvas style={{ background: "#666", width: "100%", height: "100%" }} shadows>
        <Environment 
          preset="studio"
          background={false}
          environmentIntensity={0.1}  // Giảm sáng (0-2)
          blur={0.5}                  // Làm mờ nhẹ
        />


        <directionalLight 
  position={[1, 1, 0.5]}      // Góc sáng 45°
  intensity={1.5}             // Sáng mạnh
  castShadow
  shadow-mapSize-width={2048}
  shadow-mapSize-height={2048}
/>
        
        <directionalLight 
  position={[-1, -1, -0.5]}   // Đèn phụ đối diện
  intensity={0.8}
/>
        
       <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={cameraPositions.dark.position}  // Giữ nguyên, ví dụ [-12, 12, 0] hoặc tương tự
          rotation={[-0.6, -0.7, -0.4]}
          fov={45}  // Tương đương zoom={zoomValues.default} ~1.0-1.5 ortho
          near={0.1}
          far={1000}
        />
        
        <OrbitControls/>
        <Scene
          camera={cameraRef}
          pointerRef={pointerRef}
          isExperienceReady={isExperienceReady}
          foldProgress={foldProgress} 
        />

      </Canvas>

      
      
    </>
  );
};

export default Experience;
