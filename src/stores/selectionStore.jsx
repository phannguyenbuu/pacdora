import React, { createContext, useContext, useEffect, useState } from "react";
import rules from "../json/fengshui.json";
import def_funitures from "../json/default.json";
const SelectionContext = createContext();

export function SelectionProvider({ children }) {
  // const [currentLibNodeSelection, setCurrentLibNodeSelection] = useState(null);
  // const [currentSelection, setCurrentSelection] = useState(null);
  
  const [message, setMessage] = useState('');

  // const toVN = (n) => n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  
  return (
    <SelectionContext.Provider value={{ 
      // currentLibNodeSelection, setCurrentLibNodeSelection, 
      // currentSelection, setCurrentSelection,
      message, setMessage
     }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  return useContext(SelectionContext);
}

const PointerContext = createContext();

// import materials from "../json/materials.json";

// console.log("DEF", def_funitures);
export function PointerProvider({ children }) {
  const [boxWidth, setBoxWidth] = useState(def_funitures.room.width);
  const [boxLength, setBoxLength] = useState(def_funitures.room.length);
  const [boxHeight, setBoxHeight] = useState(def_funitures.room.height);
  const [boxDepth, setBoxDepth] = useState(def_funitures.room.door);  // Fix typo

  const [originalWidth, setOriginalWidth] = useState(def_funitures.room.width);
  const [originalLength, setOriginalLength] = useState(def_funitures.room.length);
  const [originalHeight, setOriginalHeight] = useState(def_funitures.room.height);
  const [resizeRevision, setResizeRevision] = useState(0);

  // 🔥 Computed deltas (reactive, không state)
  const deltaWidth = boxWidth - originalWidth;
  const deltaLength = boxLength - originalLength;
  const deltaHeight = boxHeight - originalHeight;
  const deltaDepth = boxDepth - 0;  // Original door=0?

  return (
    <PointerContext.Provider value={{
      // Box setters
      boxWidth, setBoxWidth,
      boxLength, setBoxLength,
      boxHeight, setBoxHeight,
      boxDepth, setBoxDepth,
      
      // Original
      originalWidth, setOriginalWidth,
      originalLength, setOriginalLength,
      originalHeight, setOriginalHeight,

      // Resize commit tick to force a few extra rebuild frames
      resizeRevision,
      pulseResize: (frames = 3) => {
        let count = 0;
        const tick = () => {
          setResizeRevision((v) => v + 1);
          count += 1;
          if (count < frames) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      
      // 🔥 DELTA GETTERS (read-only)
      deltaWidth,
      deltaLength,
      deltaHeight,
      deltaDepth,
      
      // 🔥 Computed boxSize/originalSize helpers
      boxSize: { width: boxWidth, length: boxLength, height: boxHeight, depth: boxDepth },
      originalSize: {
        x: originalWidth || boxWidth,
        z: originalLength || boxLength,
        y: originalHeight || boxHeight
      },
      deltas: { width: deltaWidth, length: deltaLength, height: deltaHeight, depth: deltaDepth }
    }}>
      {children}
    </PointerContext.Provider>
  );
}


export function usePointer() {
  return useContext(PointerContext);
}

