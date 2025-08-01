import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  server: {
    port: 3001,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    },
    watch: {
      ignored: ['**/emsdk/**', '**/node_modules/**']
    }
  },
  optimizeDeps: {
    exclude: ['@webgpu/types'],
    entries: [
      'index.html'
    ]
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})