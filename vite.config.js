import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'ethers',
      '@reown/appkit',
      '@reown/appkit-adapter-ethers',
      'framer-motion',
      'lucide-react',
    ],
    force: false,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ethers': ['ethers'],
          'vendor-appkit': ['@reown/appkit', '@reown/appkit-adapter-ethers'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
        },
      },
    },
  },
  esbuild: {
    target: 'esnext',
  },
})
