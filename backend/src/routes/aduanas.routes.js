import { Router } from 'express';
import { aduanasRepo } from '../repositories/aduanas.repo.js';

const r = Router();

// GET /api/aduanas — catálogo completo, agrupable en el cliente por `tipo`.
r.get('/', async (_req, res, next) => {
  try {
    res.json(await aduanasRepo.listar());
  } catch (e) { next(e); }
});

export default r;
