import { defineConfig } from 'vite'

export default defineConfig({
  base: '/web-minecraft/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  worker: {
    format: 'es',
  },
})
