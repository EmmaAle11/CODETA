import { Router } from 'express';
import { tarifasGeneralesRepo } from '../repositories/tarifasGenerales.repo.js';

const r = Router();

// GET /api/tarifas-generales?aduana=&operacion=&modalidad=
r.get('/', async (req, res, next) => {
  try {
    const data = await tarifasGeneralesRepo.listar({
      aduana: req.query.aduana,
      operacion: req.query.operacion,
      modalidad: req.query.modalidad,
    });
    res.json(data);
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const tg = await tarifasGeneralesRepo.obtener(req.params.id);
    if (!tg) return res.status(404).json({ error: 'No encontrada' });
    res.json(tg);
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const creada = await tarifasGeneralesRepo.crear(req.body);
    res.status(201).json(creada);
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try {
    await tarifasGeneralesRepo.eliminar(req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
});

export default r;
