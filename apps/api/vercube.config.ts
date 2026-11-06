import { defineConfig } from '@vercube/core';

export default defineConfig({
  logLevel: 'debug',

  server: {
    port: 3000,
  },

  build: {
    // the typed route map apps/web imports, rewritten by `vercube dev` and `vercube build`
    typegen: true,
  },
});
