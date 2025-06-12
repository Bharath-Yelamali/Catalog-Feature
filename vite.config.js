import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/orders': 'http://localhost:3001', // Proxy /orders directly to backend
      '/api': 'http://localhost:3001', // Keep /api for other endpoints
    },
  },
})
