import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import tarifasGenerales from './tarifasGenerales.routes.js';
import tarifasCliente from './tarifasCliente.routes.js';
import cotizador from './cotizador.routes.js';

const api = Router();

// Healthcheck (sin auth) — usado por Docker/K8s y por el monolito
api.get('/health', (_req, res) => res.json({ ok: true, module: 'gt', ts: Date.now() }));

// Todo lo demás requiere token válido de Keycloak + rol del módulo
api.use(requireAuth, requireRole());

api.use('/tarifas-generales', tarifasGenerales);
api.use('/tarifas-cliente', tarifasCliente);
api.use('/cotizador', cotizador);

export default api;
