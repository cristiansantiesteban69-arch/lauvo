import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves the project from /lauvo/ rather than the domain root.
export default defineConfig({
  base: '/lauvo/',
  plugins: [react()],
})
