import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://aegis.andama.me',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
