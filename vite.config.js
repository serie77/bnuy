import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    proxy: {
      '/reddit': {
        target: 'https://www.reddit.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/reddit/, ''),
      },
      '/oauth': {
        target: 'https://oauth.reddit.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/oauth/, ''),
      }
    }
  }
})