import React, { useEffect, useState } from 'react';
import { usePointer } from '../../stores/selectionStore';
import { Space } from 'antd';

const BoxSizeSliders = () => {
  const {
    boxWidth,
    setBoxWidth,
    boxLength,
    setBoxLength,
    boxHeight,
    setBoxHeight,
    pulseResize
  } = usePointer();

  const [widthDraft, setWidthDraft] = useState(boxWidth);
  const [lengthDraft, setLengthDraft] = useState(boxLength);
  const [heightDraft, setHeightDraft] = useState(boxHeight);

  useEffect(() => {
    setWidthDraft(boxWidth);
  }, [boxWidth]);

  useEffect(() => {
    setLengthDraft(boxLength);
  }, [boxLength]);

  useEffect(() => {
    setHeightDraft(boxHeight);
  }, [boxHeight]);

  const commitWidth = () => {
    setBoxWidth(Number(widthDraft));
    pulseResize();
  };
  const commitLength = () => {
    setBoxLength(Number(lengthDraft));
    pulseResize();
  };
  const commitHeight = () => {
    setBoxHeight(Number(heightDraft));
    pulseResize();
  };
  
  

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 5, marginTop: 20}}>
      {/* Width Slider */}
      <Space direction='horizontal' style={{ width: '100%' }}>
        {/* <p>Width</p> */}
        <input
          type="range"
          min="0.2"
          max="12"
          step="0.01"
          value={widthDraft}
          onChange={(e) => setWidthDraft(Number(e.target.value))}
          onMouseUp={commitWidth}
          onTouchEnd={commitWidth}
          onKeyUp={commitWidth}
          style={{ width: "100%" }}
        />
        <p>{Math.round(widthDraft * 100)}mm</p>
      </Space>

      {/* Length Slider */}
      <Space direction='horizontal' style={{ width: '100%' }}>
        {/* <p>Length</p> */}
        <input
          type="range"
          min="0.2"
          max="12"
          step="0.01"
          value={lengthDraft}
          onChange={(e) => setLengthDraft(Number(e.target.value))}
          onMouseUp={commitLength}
          onTouchEnd={commitLength}
          onKeyUp={commitLength}
          style={{ width: "100%" }}
        />
        <p>{Math.round(lengthDraft * 100)}mm</p>
      </Space>

      

      {/* Height Slider */}
      <Space direction='horizontal' style={{vwidth: '100%' }}>
        {/* <p>Height</p> */}
        <input
          type="range"
          min="0.20"
          max="12"
          step="0.01"
          value={heightDraft}
          onChange={(e) => setHeightDraft(Number(e.target.value))}
          onMouseUp={commitHeight}
          onTouchEnd={commitHeight}
          onKeyUp={commitHeight}
          style={{ width: "100%" }}
        />
        <p>{Math.round(heightDraft * 100)}mm</p>
      </Space>
    </div>
  );
};

export default BoxSizeSliders;
