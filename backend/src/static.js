import express from 'express';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Sirve el frontend desde el MISMO proceso que la API. Un solo puerto es lo que
 * hace trivial exponerlo por un túnel Cloudflare y lo que quita el CORS.
 *
 *   /, /app, /app/*   → index.html          (el shell de Vite, conectado a la
 *                                            API real vía entities/tarifa/api)
 *   /demo, /demo/*    → gt-artefacto.html   (el artefacto viejo en memoria, se
 *                                            conserva solo como referencia)
 *   resto             → estáticos del build
 *
 * Hasta ahora la raíz servía el artefacto compilado, que corría 100% en memoria
 * del navegador. Se invierte: la raíz es la app conectada al backend, para que
 * la URL que ya tienen los testers empiece a persistir de verdad sin que nadie
 * cambie de link.
 *
 * El modo de auth se inyecta AQUÍ, en tiempo de ejecución, y no con VITE_AUTH en
 * tiempo de build: una sola imagen tiene que servir para las pruebas y para el
 * monolito, sin recompilar el bundle en cada destino.
 */
export function montarFrontend(app, distConfigurado, { auth } = {}) {
  // GT_FRONTEND_DIST suele venir relativo ('../frontend/dist'). res.sendFile
  // exige una ruta absoluta, así que se resuelve una sola vez aquí.
  const dist = distConfigurado ? path.resolve(distConfigurado) : null;
  if (!dist || !existsSync(dist)) {
    console.warn(`[GT] sin build de frontend en ${distConfigurado ?? '(no configurado)'}: solo API.`);
    return false;
  }

  const shell = path.join(dist, 'index.html');
  if (!existsSync(shell)) {
    console.warn(`[GT] ${dist} no contiene index.html: solo API.`);
    return false;
  }

  const artefacto = path.join(dist, 'gt-artefacto.html');
  const shellHtml = inyectaConfig(shell, { auth });

  app.get('/', (_req, res) => res.type('html').send(shellHtml));
  app.use(express.static(dist, { index: false }));
  app.get(/^\/app(\/.*)?$/, (_req, res) => res.type('html').send(shellHtml));
  if (existsSync(artefacto)) {
    app.get(/^\/demo(\/.*)?$/, (_req, res) => res.sendFile(artefacto));
  }

  console.log(`[GT] frontend servido desde ${dist} (raíz: index.html)`);
  return true;
}

/** Deja `window.__GT__` en el shell antes de que cargue el bundle. */
function inyectaConfig(shell, config) {
  const html = readFileSync(shell, 'utf8');
  const tag = `<script>window.__GT__=${JSON.stringify(config)}</script>`;
  return html.includes('</head>')
    ? html.replace('</head>', `${tag}</head>`)
    : tag + html;
}
