import { defineConfig } from 'vite';

// GT · Gestor de Tarifas — frontend.
// index.html es el artefacto compilado autocontenido; `npx vite --host` lo sirve tal cual.
export default defineConfig({
  base: process.env.GT_PUBLIC_BASE || '/',
  server: {
    host: true,        // --host: expone en la red (Docker / otros contenedores del monolito)
    port: 5173,
    proxy: {
      // En dev, las llamadas /api se redirigen al backend GT (cuando el artefacto se cablee a la API)
      '/api': {
        target: process.env.GT_API_TARGET || 'http://localhost:4010',
        changeOrigin: true,
      },
    },
  },
});
