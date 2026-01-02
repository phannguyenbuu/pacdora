import * as THREE from "three";
import { useSelection, usePointer } from "../stores/selectionStore";
import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import Scene from "./Scene";
import { Canvas } from "@react-three/fiber";
import { Html } from '@react-three/drei';
import { OrthographicCamera, Box, OrbitControls} from "@react-three/drei";
import { Environment } from '@react-three/drei';

import { useToggleRoomStore } from "../stores/toggleRoomStore";
import { useResponsiveStore } from "../stores/useResponsiveStore";
import { useExperienceStore } from "../stores/experienceStore";
import { useThree } from "@react-three/fiber";

import { Button, notification } from 'antd';
import WorkspaceConfig from "./components/WorkspaceConfig";
import ReactDOM from 'react-dom';

import Slider from '@mui/material/Slider';

import KonvaTextureEditor from "./components/KonvaTextureEditor";

const isMB = () => {
  return window.innerWidth < 768;
}


function SaveScreenshotButton({capture, setCapture}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    if(capture)
    {
      handleSave();
      setCapture(false);
    }
  },[capture]);

  const handleSave = () => {
    gl.render(scene, camera);
    const imgData = gl.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imgData;
    link.download = 'screenshot.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <></>
  );
}

function NotificationContainer({ children }) {
  const [container, setContainer] = useState(null);

  useEffect(() => {
    setContainer(document.getElementById('portal-root'));
  }, []);

  if (!container) return null;

  return ReactDOM.createPortal(children, container);
}


const Experience = () => {
  const [api, contextHolder] = notification.useNotification();
  const cameraRef = useRef();
  const pointerRef = useRef({ x: 0, y: 0 });
  const { isExperienceReady } = useExperienceStore();
  const {setMessage} =  useSelection();
  const { isMobile } = useResponsiveStore();
  const [capture, setCapture] = useState(false);
  
  const {addedHighlights} = usePointer();

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

  const [foldProgress, setFoldProgress] = useState(45);
  

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
      <Canvas style={{ background: '#666', position: "fixed", zIndex: 1, top: 0, left: 0 }} shadows gl={{ preserveDrawingBuffer: true }}>
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
        
        <OrthographicCamera
          ref={cameraRef}
          makeDefault
          position={cameraPositions.dark.position}
          rotation={[
            -0.6, -0.7, -0.4,
          ]}
          zoom={zoomValues.default}
        />
        
        <OrbitControls/>
        <Scene
          camera={cameraRef}
          pointerRef={pointerRef}
          isExperienceReady={isExperienceReady}
          foldProgress={foldProgress} 
        />

      </Canvas>

      <div style={{ position: 'fixed', left: 20,  top: 50,
           color: 'black', zIndex:99 }}>
          <KonvaTextureEditor svgPath="/box-sample/150010.svg"/>
          <WorkspaceConfig/>
      </div>
      <Slider 
      value={foldProgress}
      onChange={(_, v) => setFoldProgress(v)}
      min={0} 
      max={1} 
      step={0.01}
      marks={[
        { value: 0, label: 'A1 Mở' },
        { value: 0.5, label: '45°' },
        { value: 1, label: 'A1 Gập 90°' }
      ]}
      sx={{ 
        position: 'fixed', 
        bottom: 50, 
        right: 50, 
        width: 250, 
        zIndex: 1000 
      }}
    />
    </>
  );
};

export default Experience;
