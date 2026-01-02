// KonvaTextureEditor.jsx - FULL CANVAS SVG FIT
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, FastLayer , Image, Transformer, Rect } from 'react-konva';
import { useUploadTextureStore } from '../../stores/uploadTextureStore';
import { Button } from 'antd';

const KonvaTextureEditor = ({ svgPath = null }) => {
  const { editorImage, showEditor, closeEditor, updateTextureFromCanvas } = useUploadTextureStore();
  const stageRef = useRef();
  const imageRef = useRef();
  const svgImageRef = useRef();
  const trRef = useRef();
  const [svgImage, setSvgImage] = useState(null);

  const handleTransformEnd = useCallback(() => {
    const stage = stageRef.current;
    const imageNode = imageRef.current;
    
    if (!stage || !imageNode) return;

    const bbox = imageNode.getClientRect();
    const x = Math.floor(bbox.x);
    const y = Math.floor(bbox.y);
    const w = Math.floor(bbox.width);
    const h = Math.floor(bbox.height);
    
    const stageCanvas = stage.toCanvas();
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = 512;
    croppedCanvas.height = 512;
    const ctx = croppedCanvas.getContext('2d');
    
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, 512, 512);
    ctx.drawImage(stageCanvas, x, y, w, h, x, y, w, h);

    console.log("3D Need Update");
    updateTextureFromCanvas(croppedCanvas);
    // window.dispatchEvent(new CustomEvent('forceTextureUpdate'));
  }, [updateTextureFromCanvas]);

  // 🔥 FIXED: FULL CANVAS FIT (cover entire 512x512)
  // 🔥 BULLETPROOF SVG LOAD với RETRY + LOGS
const loadSvgFromPath = useCallback(async () => {
  console.log('🔍 CHECK:', { svgPath, refReady: !!svgImageRef.current });
  
  // RETRY nếu ref chưa ready
  if (!svgPath || !svgImageRef.current) {
    console.warn('⏳ SVG waiting ref... retry 200ms');
    setTimeout(() => loadSvgFromPath(), 200);
    return;
  }

  try {
    console.log('🌐 Fetching:', svgPath);
    const response = await fetch(svgPath);
    console.log('📥 Response:', response.status, response.ok);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const svgText = await response.text();
    console.log('📄 SVG text length:', svgText.length);
    
    const svgDataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgText)}`;
    
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log('🖼️ SVG loaded natural:', img.naturalWidth, 'x', img.naturalHeight);
      
      // RASTERIZE + FIT luôn
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'transparent'; 
      ctx.fillRect(0,0,512,512);
      
      const scale = Math.max(512/img.naturalWidth, 512/img.naturalHeight);
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      const ox = (512 - w)/2, oy = (512 - h)/2;
      
      ctx.drawImage(img, ox, oy, w, h);
      
      const finalDataUrl = canvas.toDataURL('image/png');
      const konvaImg = new window.Image();
      konvaImg.onload = () => {
        svgImageRef.current.setAttrs({
          image: konvaImg, width: 512, height: 512, x: 0, y: 0,
          opacity: 0.85, draggable: false,
          listening: false,      // ✅ Block events
          visibleToHitgraph: false 
        });
        // console.log('✅ SVG FULLY FITTED 512x512!');
      };
      konvaImg.src = finalDataUrl;
    };
    img.onerror = (e) => console.error('🖼️ SVG image load fail:', e);
    img.src = svgDataUrl;
    
  } catch (error) {
    console.error('💥 SVG LOAD ERROR:', error);
  }
}, [svgPath]);


  useEffect(() => {
    if (svgPath) {
      loadSvgFromPath();
    } else {
      setSvgImage(null);
      if (svgImageRef.current) {
        svgImageRef.current.setAttrs({ image: null });
      }
    }
  }, [svgPath, ]);

  // REST OF COMPONENT (giữ nguyên)
  useEffect(() => {
    if (!editorImage || !imageRef.current) return;
    const img = editorImage;
    if (img.complete) {
      fitImageToCanvas();
    } else {
      img.onload = () => fitImageToCanvas();
    }
  }, [editorImage]);

  const fitImageToCanvas = useCallback(() => {
    const imageNode = imageRef.current;
    if (!imageNode) return;

    const stageSize = 512;
    const img = editorImage;
    const scale = Math.min(stageSize / img.naturalWidth, stageSize / img.naturalHeight);
    
    imageNode.setAttrs({
      x: (stageSize - img.naturalWidth * scale) / 2,
      y: (stageSize - img.naturalHeight * scale) / 2,
      width: img.naturalWidth * scale,
      height: img.naturalHeight * scale,
      scaleX: 1,
      scaleY: 1,
      rotation: 0
    });

    trRef.current?.nodes([imageNode]);
    stageRef.current?.container()?.focus();
  }, [editorImage]);


  if (!showEditor || !editorImage) return null;

  return (
    <div className="konva-editor-overlay">
      <div className="konva-editor">
        
        <div className="konva-canvas">
          <Stage width={512} height={512} ref={stageRef}>
            <Layer>
              {Array.from({ length: 256 }).map((_, i) => (
                <Rect
                  key={i}
                  x={(i % 16) * 32}
                  y={Math.floor(i / 16) * 32}
                  width={32}
                  height={32}
                  fill={((i % 16 + Math.floor(i / 16)) % 2 === 0) ? '#d3d3d3' : '#f5f5f5'}
                />
              ))}
              
              <Image ref={imageRef} image={editorImage} draggable rotation={0} scaleX={1} scaleY={1}
                  onDragEnd={handleTransformEnd}
                  onTransformEnd={handleTransformEnd}
              />
              
              {svgPath && (
                
                <Image
                  ref={svgImageRef}
                  draggable={false}
                  listening={false}
                  globalCompositeOperation="source-over"  // Không block
                  shadowForStrokeEnabled={false}
                  hitStrokeWidth={0}
                  strokeWidth={0}
                  perfectDrawEnabled={false}
                />
                
              )}
              
              <Transformer
                ref={trRef}
                boundBoxFunc={(oldBox, newBox) => newBox}
                flipEnabled={true}
              />
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default KonvaTextureEditor;
