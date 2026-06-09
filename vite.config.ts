import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages project site: https://<user>.github.io/Asahi-HRMS/
const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
})
