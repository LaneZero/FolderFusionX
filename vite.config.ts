import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/FolderFusionX/', // Update this to match your repository name
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          d3: ['d3'],
          ui: ['lucide-react', 'html2canvas']
        }
      }
    }
  }
});