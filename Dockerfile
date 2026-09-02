# ============================================================================
# GT — imagen única: un solo proceso Node sirve la API y el frontend.
#
# Este repo no tiene workspaces (backend/ y frontend/ son dos package.json
# independientes), a diferencia del fork de CODETA. Un solo puerto es lo que
# permite exponerlo por túnel Cloudflare o Render sin CORS — es el modo "un
# solo servicio" documentado en docs/arquitectura.md, no el modo "dos
# servicios" del monolito (ese usa backend/Dockerfile y frontend/Dockerfile
# por separado, detrás del gateway).
# ============================================================================

FROM node:20-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/tsconfig.json frontend/vite.config.ts frontend/index.html ./
COPY frontend/public ./public
COPY frontend/src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --omit=dev && npm cache clean --force

COPY backend/src ./backend/src
COPY db ./db
COPY --from=build-frontend /app/frontend/dist ./frontend/dist

USER node
# Render/Railway inyectan PORT; 4010 es solo el valor por defecto de GT_PORT.
EXPOSE 4010
ENV GT_FRONTEND_DIST=/app/frontend/dist
# El `exec` es necesario: sin él, node no sería PID 1 y perdería el SIGTERM.
CMD ["sh", "-c", "node backend/src/scripts/migrate.js && exec node backend/src/server.js"]
