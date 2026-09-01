FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve

# El artefacto autocontenido es la app servida (mismos estilos/componentes/reglas)
COPY index.html ./public/index.html

EXPOSE 5173
# -s: single-page fallback; sirve index.html en la raíz
CMD ["serve", "-s", "public", "-l", "5173"]
