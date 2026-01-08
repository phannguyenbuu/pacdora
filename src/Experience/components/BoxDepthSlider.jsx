import React, { useState, useEffect } from 'react';
import { usePointer } from '../../stores/selectionStore';
import { Space } from 'antd';

function boxDepthSlider() {
  const [sliderValue, setSliderValue] = useState(0);
  const {boxWidth, boxLength, boxDepth, setboxDepth} = usePointer();
  
   useEffect(() => {
    if (boxDepth !== sliderValue) {
      setSliderValue(boxDepth);
    }
  }, [boxDepth]);

  const onSliderChange = (value) => {
    setSliderValue(value);
    setboxDepth(value);
  };

  return (
    <Space direction='horizontal' style={{ width: '100%' }}>
      <p>Depth</p>
      <input
        style={{ width: '100%' }}
        type="range"
        min={0.2}
        max={5}
        step={0.1}
        value={sliderValue}
        onChange={e => onSliderChange(Math.floor(parseFloat(e.target.value) * 10) / 10)}
      />
      <p>{boxDepth}mm</p>
      
    </Space>
  );
}

export default boxDepthSlider;
