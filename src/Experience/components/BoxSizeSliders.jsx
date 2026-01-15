import React, {useState, useEffect} from 'react';
import { usePointer } from '../../stores/selectionStore';
import { Space } from 'antd';

const BoxSizeSliders = () => {
  const { boxWidth, setBoxWidth, boxLength, 
        setBoxLength, boxHeight, setBoxHeight,
        boxDepth, setBoxDepth
       } = usePointer();
  
  const handleWidthChange = (e) => setBoxWidth(Number(e.target.value));
  const handleLengthChange = (e) => setBoxLength(Number(e.target.value));
  const handleHeightChange = (e) => {
    
    setBoxHeight(Number(e.target.value));
  }
;
  
  

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 5, marginTop: 20}}>
      {/* Width Slider */}
      <Space direction='horizontal' style={{ width: '100%' }}>
        {/* <p>Width</p> */}
        <input
          type="range"
          min="0.2"
          max="20"
          step="0.01"
          value={boxWidth}
          onChange={handleWidthChange}
          style={{ width: "100%" }}
        />
        <p>{boxWidth * 100}mm</p>
      </Space>

      {/* Length Slider */}
      <Space direction='horizontal' style={{ width: '100%' }}>
        {/* <p>Length</p> */}
        <input
          type="range"
          min="0.2"
          max="20"
          step="0.01"
          value={boxLength}
          onChange={handleLengthChange}
          style={{ width: "100%" }}
        />
        <p>{boxLength * 100}mm</p>
      </Space>

      

      {/* Height Slider */}
      <Space direction='horizontal' style={{vwidth: '100%' }}>
        {/* <p>Height</p> */}
        <input
          type="range"
          min="0.20"
          max="20"
          step="0.01"
          value={boxHeight}
          onChange={handleHeightChange}
          style={{ width: "100%" }}
        />
        <p>{boxHeight * 100}mm</p>
      </Space>
    </div>
  );
};

export default BoxSizeSliders;