import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import api from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// El módulo se monta bajo /api/gt cuando vive dentro del gateway del
// monolito; en standalone se expone en /api. Se controla por prefijo.
const BASE = process.env.GT_BASE_PATH || '/api';
app.use(BASE, api);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`[GT] API escuchando en :${env.port}${BASE}`);
  console.log(`[GT] Keycloak issuer: ${env.keycloak.issuer}`);
  console.log(`[GT] DB: ${env.db.host}:${env.db.port}/${env.db.database} (schema ${env.db.schema})`);
});
