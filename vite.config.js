import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import liveReload from 'vite-plugin-live-reload' // 🔥 JSON HOT RELOAD

export default defineConfig(({ mode }) => ({
  base: '/pac/',
  plugins: [
    react(),
    // 🔥 WATCH JSON FILES - HOT RELOAD NGAY!
    liveReload([
      'json/pointConfig/**/*.json',      // Tất cả config JSON
      'src/**/*.json',                   // JSON trong src
      'public/**/*.json'                 // JSON public
    ])
  ],
  server: {
    open: '/pac/',
  },
  // 🔥 TĂNG SPEED JSON IMPORT
  esbuild: {
    target: 'es2020'
  },
  optimizeDeps: {
    include: ['three']
  }
}))
