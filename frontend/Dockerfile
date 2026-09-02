# Build del frontend real (Vite + React). El resultado (dist/) lo sirve el
# backend desde su mismo proceso vía GT_FRONTEND_DIST; esta imagen se conserva
# para el despliegue de dos servicios del monolito (gateway /gt -> :5173).
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
# El shell conectado a la API queda en la raíz; public/gt-artefacto.html viaja
# dentro del build y sigue accesible como referencia.
COPY --from=build /app/dist ./dist

EXPOSE 5173
# -s: fallback SPA; sirve dist/index.html en la raíz
CMD ["serve", "-s", "dist", "-l", "5173"]
