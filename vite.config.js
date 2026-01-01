import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  base: '/',  // ✅ Đổi từ '/fureal3D/' → '/creative/'
  plugins: [react()],
}))

