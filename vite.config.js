import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Necessário para aceitar conexões vindas do Docker
    port: 5173,
    watch: {
      usePolling: true, // Garante detecção no volume Linux 
    },
    hmr: {
      clientPort: 5173, // Fixa a porta para o Hot Reload
    },
  },
})
