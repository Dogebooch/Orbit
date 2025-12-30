import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative paths for Electron file:// protocol
  base: './',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Ensure assets use relative paths
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Consistent chunk naming
        manualChunks: undefined,
      },
    },
  },
});
