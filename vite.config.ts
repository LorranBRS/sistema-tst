import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base relativa: funciona no GitHub Pages (lorranbrs.github.io/sistema-tst/) e localmente
export default defineConfig({
  base: './',
  plugins: [react()],
})
