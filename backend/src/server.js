import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import api from './routes/index.js';
import { montarFrontend } from './static.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Con un solo servicio sirviendo front y API el origen es el mismo y CORS
// sobra; se aplica solo si se declaran orígenes (despliegue de dos servicios).
if (env.corsOrigins.length) {
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
}
app.use(express.json({ limit: '2mb' }));

// El módulo se monta bajo /api/gt cuando vive dentro del gateway del
// monolito; en standalone se expone en /api. Se controla por prefijo.
const BASE = process.env.GT_BASE_PATH || '/api';
app.use(BASE, api);

// El build del frontend, servido por este mismo proceso cuando GT_FRONTEND_DIST
// apunta a él. Va DESPUÉS de la API para que nunca le robe una ruta /api/*.
montarFrontend(app, env.frontendDist, { auth: env.auth });

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`[GT] API escuchando en :${env.port}${BASE}`);
  console.log(`[GT] Auth: ${env.auth} (rol requerido: ${env.keycloak.requiredRole})`);
  console.log(`[GT] Keycloak issuer: ${env.keycloak.issuer}`);
  console.log(
    env.db.url
      ? `[GT] DB: DATABASE_URL (schema ${env.db.schema})`
      : `[GT] DB: ${env.db.host}:${env.db.port}/${env.db.database} (schema ${env.db.schema})`
  );
});
