import React, { createContext, useContext, useEffect, useState } from "react";
const SelectionContext = createContext();

export function SelectionProvider({ children }) {
  const [currentLibNodeSelection, setCurrentLibNodeSelection] = useState(null);
  const [currentSelection, setCurrentSelection] = useState(null);
  
  const [message, setMessage] = useState('');
  
  return (
    <SelectionContext.Provider value={{ 
      currentLibNodeSelection, setCurrentLibNodeSelection, 
      currentSelection, setCurrentSelection,
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

export function PointerProvider({ children }) {
  return (
    <PointerContext.Provider value={{ }}>
      {children}
    </PointerContext.Provider>
  );
}

export function usePointer() {
  return useContext(PointerContext);
}
