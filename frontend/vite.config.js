import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // needed for the Docker Container port mapping
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true // enables HMR inside WSL2/Docker containers
    }
  }
})
