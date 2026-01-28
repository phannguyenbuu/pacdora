// uploadTextureStore.js
import { create } from 'zustand';
import * as THREE from 'three';
import { DEFAULT_TEXTURE_SIZE, TEXTURE_SCALE } from "../constants/texture";

export const useUploadTextureStore = create((set, get) => ({
  currentImage: null,
  currentTexture: null,
  showEditor: false,
  editorImage: null,
  defaultImageUrl: `${import.meta.env.BASE_URL}hoasen_03.png`,
  backgroundColor: "#ffffff",
  insideMode: "Cardboard",
  insideColor: "#c79a63",
  is3dBusy: false,
  editorActions: {},
  piecesDataUrls: {},

  // 🔥 GETTER cho BoxSample
  getCurrentTexture: () => get().currentTexture,

  // 🔥 UPLOAD + MỞ EDITOR
  uploadImage: async (file) => {
    const img = new Image();
    img.onload = () => {
      set({ 
        currentImage: img,
        editorImage: img,
        showEditor: true
      });
      
      // Texture tạm
      createTextureFromImage(img, set);
    };
    img.src = URL.createObjectURL(file);
  },

  initDefaultImage: () => {
    if (get().currentImage) return;
    const img = new Image();
    img.onload = () => {
      set({
        currentImage: img,
        editorImage: img,
      });
      createTextureFromImage(img, set);
    };
    img.src = get().defaultImageUrl;
  },

  setBackgroundColor: (color) => set({ backgroundColor: color || "#ffffff" }),
  setInsideMode: (mode) => {
    const nextMode = mode === "Cardboard" ? "Cardboard" : "White";
    const nextColor = nextMode === "Cardboard" ? "#c79a63" : "#ffffff";
    set({ insideMode: nextMode, insideColor: nextColor });
  },
  setInsideColor: (color) => set({ insideColor: color || "#ffffff" }),
  set3dBusy: (busy) => set({ is3dBusy: !!busy }),
  setEditorActions: (actions) => set({ editorActions: actions || {} }),
  setPiecesDataUrls: (pieces) =>
    set({
      piecesDataUrls: pieces || {},
      textureKey: Date.now(),
    }),

  // 🔥 UPDATE từ Konva canvas
  updateTextureFromCanvas: (canvas) => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false;
    texture.needsUpdate = true;
    texture.encoding = THREE.sRGBEncoding;  // 🔥 Critical cho color
    texture.version = performance.now();     // 🔥 Force cache bust
    
    set({ 
      currentTexture: texture,
      textureKey: Date.now()  // React key
    });
    window.dispatchEvent(new CustomEvent('liveTextureUpdate'));
  },

  

  // 🔥 ĐÓNG EDITOR
  openEditor: () => set({ showEditor: true }),

  closeEditor: () => set({ showEditor: false })
}));

// 🔥 HELPER (ngoài store)
const createTextureFromImage = (img, set) => {
  const canvas = document.createElement('canvas');
  const size = DEFAULT_TEXTURE_SIZE * TEXTURE_SCALE;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, size, size);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.needsUpdate = true;
  set({ currentTexture: texture });
};

