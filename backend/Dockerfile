FROM node:20-alpine
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src
# Las migraciones viven fuera de backend/, se montan o copian según el orquestador.

ENV NODE_ENV=production
EXPOSE 4010
CMD ["node", "src/server.js"]
