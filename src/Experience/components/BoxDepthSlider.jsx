import React, { useEffect, useState } from 'react';
import { usePointer } from '../../stores/selectionStore';
import { Space } from 'antd';

function boxDepthSlider() {
  const [sliderValue, setSliderValue] = useState(0);
  const { boxDepth, setBoxDepth, pulseResize } = usePointer();
  
   useEffect(() => {
    const next = boxDepth / 10;
    if (next !== sliderValue) {
      setSliderValue(next);
    }
  }, [boxDepth]);

  const onSliderChange = (value) => {
    setSliderValue(value);
  };

  const commitDepth = () => {
    setBoxDepth(sliderValue * 10);
    pulseResize();
  };

  const depthMm = sliderValue * 10;

  return (
    <Space direction='horizontal' style={{ width: '100%' }}>
      <p>Depth</p>
      <input
        style={{ width: '100%' }}
        type="range"
        min={0.1}
        max={0.3}
        step={0.05}
        value={sliderValue}
        onChange={(e) => {
          const raw = parseFloat(e.target.value);
          const snapped = Math.round(raw / 0.05) * 0.05;
          onSliderChange(Number(snapped.toFixed(2)));
        }}
        onMouseUp={commitDepth}
        onTouchEnd={commitDepth}
        onKeyUp={commitDepth}
      />
      <p>{depthMm}mm</p>
      
    </Space>
  );
}

export default boxDepthSlider;
