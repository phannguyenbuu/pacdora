// uploadTextureStore.js
import { create } from 'zustand';
import * as THREE from 'three';

export const useUploadTextureStore = create((set, get) => ({
  currentImage: null,
  currentTexture: null,
  showEditor: false,
  editorImage: null,

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
  closeEditor: () => set({ showEditor: false })
}));

// 🔥 HELPER (ngoài store)
const createTextureFromImage = (img, set) => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, 512, 512);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.needsUpdate = true;
  set({ currentTexture: texture });
};

