import React, { createContext, useContext, useEffect, useState } from "react";
import rules from "../json/fengshui.json";
import def_funitures from "../json/default.json";
const SelectionContext = createContext();

export function SelectionProvider({ children }) {
  const [currentLibNodeSelection, setCurrentLibNodeSelection] = useState(null);
  const [currentSelection, setCurrentSelection] = useState(null);
  
  const [message, setMessage] = useState('');

  const toVN = (n) => n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  
  return (
    <SelectionContext.Provider value={{ 
      currentLibNodeSelection, setCurrentLibNodeSelection, 
      currentSelection, setCurrentSelection,
      message, setMessage, toVN
     }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  return useContext(SelectionContext);
}

const PointerContext = createContext();

import materials from "../json/materials.json";

console.log("DEF", def_funitures);

export function PointerProvider({ children }) {
  
  // const [isMoving, setIsMoving] = useState(false);
  const [pointer, setPointer] = useState(null);
  const [rotationIndex, setRotationIndex] = useState(0);
  const [directionAxis, setDirectionAxis] = useState(0);
  const [personAge, setPersonAge] = useState("Kim");
  const [addedHighlights, setAddedHighlights] = useState(def_funitures.models);
  // const [releaseMouse, setReleaseMouse] = useState(false);
  const [boxWidth, setBoxWidth] = useState(def_funitures.room.width);
  const [boxLength, setBoxLength] = useState(def_funitures.room.length);
  const [boxHeight, setBoxHeight] = useState(def_funitures.room.height);
  const [boxDepth, setboxDepth] = useState(def_funitures.room.door);
  
  const [wallType01, setWallType01] = useState({"type":"wall"});
  const [wallMtl01, setWallMtl01] = useState(null);
  const [wallType02, setWallType02] = useState({"type":"glasswall"});
  const [wallMtl02, setWallMtl02] = useState(null);
  const [floorMtl, setFloorMtl] = useState({"material":"granite_tile_02"});

  const [cart, setCart] = useState([]);

  useEffect(()=>{
    setWallMtl01(materials.find(el => el.material === "granular_concrete"));
    setWallMtl02(materials.find(el => el.material === "granular_concrete"));
    setFloorMtl(materials.find(el => el.material ==="laminate_floor_02"));
  },[materials]);

  const getResult = () => {
    const i = addedHighlights.findIndex(item => item.data.type === "bed");
    if (i === -1) {
      return (`Hướng đầu giường:
      |✔️${rules[personAge].valid}|❌${rules[personAge].invalid}`);
    }

    const directions = ["Nam", "Đông", "Bắc", "Đông Bắc", "Đông Nam", "Tây Nam", "Tây", "Tây Bắc"];

    const angle = rotationIndex * 90 + directionAxis + 180; // tính góc thực tế
    const dirIndex = getDirectionIndex(angle);

    let msg = `${directions[dirIndex]}${rules[personAge].valid.includes(directions[dirIndex])?'✔️':'❌'}`;

    if(rotationIndex===0)
      msg += 'Đầu giường không nên quay về hướng cửa đi';
    else if(rotationIndex===3)
      msg += 'Đầu giường không nên quay về hướng cửa sổ';
    else
      msg += 'Vị trí hợp lý so với cửa đi và cửa sổ';

    return (`Hướng đầu giường hiện tại: ${msg}
      |✔️${rules[personAge].valid}|❌${rules[personAge].invalid}`);
  }

  const deletePointerId = (id) => {
    const newHighlights = addedHighlights.filter(item => item.id !== id);
    setAddedHighlights(newHighlights);
    setCurrentSelection(null);
  }

  
    async function fetchSaveApi() {
      const url = 'https://admake.vn/api/fureal/save';
      const data = {
        models: addedHighlights,
        room: {width:boxWidth, height:boxHeight, length: boxLength, door:boxDepth}
      };

      try {
        const response = await fetch(url, {
          method: 'POST', // hoặc 'GET' tùy API
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({username:"Test", data}) // dữ liệu gửi đi
        });
  
        if (!response.ok) {
  
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const result = await response.json(); // parse JSON trả về
        console.log('Save:', data, result);
        // setMessage({message:`Lưu file thành công`});
        return result;
      } catch (error) {
        // Bắt lỗi mạng hoặc lỗi khác
        // setMessage(`Lưu file thất bại:`);
        throw error; // hoặc xử lý lỗi theo cách bạn muốn
      }
    }
  
    const saveJson = () => {
      fetchSaveApi(addedHighlights);
    }
  
  
    const loadJson = () => {
      // fetchLoadApi("Test");
    }


  function getDirectionIndex(angle) {
    const adjustedAngle = (angle + 360) % 360; // chuẩn hóa 0-360

    if (adjustedAngle >= 337.5 || adjustedAngle < 22.5) return 2;  // Bắc (index 2)
    if (adjustedAngle >= 22.5 && adjustedAngle < 67.5) return 3;   // Đông Bắc (3)
    if (adjustedAngle >= 67.5 && adjustedAngle < 112.5) return 1;  // Đông (1)
    if (adjustedAngle >= 112.5 && adjustedAngle < 157.5) return 4; // Đông Nam (4)
    if (adjustedAngle >= 157.5 && adjustedAngle < 202.5) return 0; // Nam (0)
    if (adjustedAngle >= 202.5 && adjustedAngle < 247.5) return 5; // Tây Nam (5)
    if (adjustedAngle >= 247.5 && adjustedAngle < 292.5) return 3; // Tây (3)
    if (adjustedAngle >= 292.5 && adjustedAngle < 337.5) return 7; // Tây Bắc (7)
  }



  const positionPointer = (id, pos) => {
    setAddedHighlights((current) => {
      const i = current.findIndex(item => item.id === id);
      console.log('Index', i);
      if (i === -1) return current;

      const newHighlights = [...current];
      newHighlights[i] = {
        ...newHighlights[i],
        position: pos,
      };
      return newHighlights;
    });
  };


  const setPointerIdRotationIndex = (id, index) => {
    setAddedHighlights((current) => {
      const i = current.findIndex(item => item.id === id);
      if (i === -1) return current;

      const newHighlights = [...current];
      newHighlights[i] = {
        ...newHighlights[i],
        rotationIndex: index,
      };
      return newHighlights;
    });
  };



  const rotateRight = (id) => {
    if (addedHighlights.length !== 0) {
      setAddedHighlights((prev) => {
        const newHighlights = [...prev];
        let lastIndex = newHighlights.length - 1;

        if(id)
        {
          const i = prev.findIndex(item => item.id === id);
          if (i !== -1) lastIndex = i;
        }

        newHighlights[lastIndex] = {
          ...newHighlights[lastIndex],
          rotationIndex: ((newHighlights[lastIndex].rotationIndex || 0) + 1) % 4,
        };
        setRotationIndex(newHighlights[lastIndex].rotationIndex);
        setPointer(newHighlights[lastIndex]);
        return newHighlights;
      });
    }
  };

  // Hàm xoay trái (-90 độ)
  const rotateLeft = (id) => {
    if (addedHighlights.length !== 0) {
      setAddedHighlights((prev) => {
        const newHighlights = [...prev];

        let lastIndex = newHighlights.length - 1;

        if(id)
        {
          const i = prev.findIndex(item => item.id === id);
          if (i !== -1) lastIndex = i;
        }

        
        newHighlights[lastIndex] = {
          ...newHighlights[lastIndex],
          rotationIndex:
            ((newHighlights[lastIndex].rotationIndex || 0) + 3) % 4, // -1 mod 4
        };
        setRotationIndex(newHighlights[lastIndex].rotationIndex);
        setPointer(newHighlights[lastIndex]);
        return newHighlights;
      });
    }
  };

  return (
    <PointerContext.Provider value={{ pointer, setPointer, personAge, setPersonAge,
        directionAxis, setDirectionAxis, getResult,saveJson,loadJson,
        addedHighlights, setAddedHighlights, 
        deletePointerId,
        boxWidth, setBoxWidth,
        boxLength, setBoxLength,
        boxHeight, setBoxHeight,
        rotateLeft, rotateRight, 
        boxDepth, setboxDepth,
        cart, setCart,
        wallType01, setWallType01,
        wallMtl01, setWallMtl01,
        wallType02, setWallType02,
        wallMtl02, setWallMtl02,
        floorMtl, setFloorMtl,
        positionPointer, setPointerIdRotationIndex }}>
      {children}
    </PointerContext.Provider>
  );
}

export function usePointer() {
  return useContext(PointerContext);
}


export function getPersoNAgeByBornYear() {
  
  if (namSinh < 1925 || namSinh > 2025) {
    return "Năm sinh không hợp lệ (1925 - 2025)";
  }
  
  // Bảng 60 năm Can Chi tương ứng (theo thứ tự từ 1924 là Giáp Tý)
  const can = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
  const chi = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  
  // Các mệnh ngũ hành theo Can (đơn giản, 10 Can)
  const menhCan = {
    'Giáp': 'Mộc',
    'Ất': 'Mộc',
    'Bính': 'Hỏa',
    'Đinh': 'Hỏa',
    'Mậu': 'Thổ',
    'Kỷ': 'Thổ',
    'Canh': 'Kim',
    'Tân': 'Kim',
    'Nhâm': 'Thủy',
    'Quý': 'Thủy'
  };
  
  // Tính năm cách 1924 (năm Giáp Tý)
  const offset = (namSinh - 1924);
  
  const canName = can[offset % 10];
  const chiName = chi[offset % 12];
  const menh = menhCan[canName];
  
  return { can: canName, chi: chiName, menh };


}