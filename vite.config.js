import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
    ],
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
            },
            {
              name: 'mui-vendor',
              test: /node_modules[\\/](@mui|@emotion)[\\/]/,
            },
            {
              name: 'firebase-vendor',
              test: /node_modules[\\/](@firebase|firebase)[\\/]/,
            },
            {
              name: 'philippine-places',
              test: /node_modules[\\/]phil-reg-prov-mun-brgy[\\/]/,
            },
            {
              name: 'jspdf-vendor',
              test: /node_modules[\\/](jspdf|jspdf-autotable|dompurify|canvg|fflate|iobuffer|pako|raf|rgbcolor|stackblur-canvas|svg-pathdata)[\\/]/,
            },
            {
              name: 'html2canvas-vendor',
              test: /node_modules[\\/]html2canvas[\\/]/,
            },
          ],
        },
      },
    },
  },
})
