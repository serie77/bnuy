import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To add only specific polyfills, add them here
      // If no option is passed, adds all polyfills
      include: ['buffer', 'crypto', 'stream', 'util'],
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    })
  ],
  base: './',
  define: {
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'reddit': ['axios'],
          'solana': ['@solana/web3.js', '@solana/wallet-adapter-base', '@solana/wallet-adapter-react']
        }
      }
    },
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000
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
  },
  optimizeDeps: {
    include: ['buffer', '@solana/web3.js', '@solana/wallet-adapter-base']
  }
})