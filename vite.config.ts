import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' + HashRouter = works under any GitHub Pages repo name, no config needed.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
