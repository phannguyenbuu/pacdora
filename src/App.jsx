import "./App.scss";
import React, { useEffect } from "react";

import { useResponsiveStore } from "./stores/useResponsiveStore";
import Router from "./routes/Router";
import Overlay from "./components/Overlay/Overlay";
import { SelectionProvider, PointerProvider } from "./stores/selectionStore";
import 'antd/dist/reset.css';

function App() {
  const { updateDimensions } = useResponsiveStore();

  console.log("[boot] App render");

  useEffect(() => {
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, [updateDimensions]);

  return (
    <PointerProvider>
      <SelectionProvider>
        {/* <Menu /> */}
        {/* <Logo /> */}
        {/* <LoadingPage /> */}
        <Overlay />
        <Router />
        
      </SelectionProvider>
    </PointerProvider>
  );
}

export default App;
