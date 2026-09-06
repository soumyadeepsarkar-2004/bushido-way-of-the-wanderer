import { defineConfig } from 'vite';
import { checker } from 'vite-plugin-checker';

export default defineConfig({
  plugins: [checker({ ts: true })],
  server: {
    port: 3000,
    open: false,
    host: true
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    sourcemap: true,
    cssCodeSplit: true,
    minify: 'oxc',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three-vendor';
          if (id.includes('node_modules/simplex-noise')) return 'simplex-vendor';
          if (id.includes('node_modules')) return 'vendor';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    reportCompressedSize: true
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  }
});
