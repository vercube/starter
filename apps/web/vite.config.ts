import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': new URL('./src', import.meta.url).pathname,
    },
  },
  server: {
    port: 5173,
    // the Vercube dev server, started next to this one by `dev` at the root
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
