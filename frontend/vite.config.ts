import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GT · Gestor de Tarifas — frontend.
// En producción NO se sirve con Vite: el backend sirve `dist/` desde el mismo
// proceso (un solo puerto, sin CORS). Esto es solo el servidor de desarrollo.
export default defineConfig({
  base: process.env.GT_PUBLIC_BASE || '/',
  plugins: [react()],
  server: {
    host: true,        // --host: expone en la red (Docker / otros contenedores)
    port: 5173,
    proxy: {
      // En dev, las llamadas /api se redirigen al backend GT
      '/api': {
        target: process.env.GT_API_TARGET || 'http://localhost:4010',
        changeOrigin: true,
      },
    },
  },
});
