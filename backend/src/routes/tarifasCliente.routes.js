import { Router } from 'express';
import { tarifasClienteRepo } from '../repositories/tarifasCliente.repo.js';

const r = Router();

// GET /api/tarifas-cliente?estado=&rfc=&aduana=&enProceso=1&nivel=
r.get('/', async (req, res, next) => {
  try {
    const data = await tarifasClienteRepo.listar({
      estado: req.query.estado,
      rfc: req.query.rfc,
      aduana: req.query.aduana,
      operacion: req.query.operacion,
      modalidad: req.query.modalidad,
      nivel: req.query.nivel,
      enProceso: req.query.enProceso === '1',
    });
    res.json(data);
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const tp = await tarifasClienteRepo.obtener(req.params.id);
    if (!tp) return res.status(404).json({ error: 'No encontrada' });
    res.json(tp);
  } catch (e) { next(e); }
});

// Crear (nace en 'captura' o 'generada' según el modo que envíe el frontend)
r.post('/', async (req, res, next) => {
  try {
    const creada = await tarifasClienteRepo.crear(req.body, req.user?.username);
    res.status(201).json(creada);
  } catch (e) { next(e); }
});

// Editar datos (permitido mientras esté en captura; el frontend lo controla)
r.put('/:id', async (req, res, next) => {
  try {
    const upd = await tarifasClienteRepo.actualizarDatos(req.params.id, req.body);
    if (!upd) return res.status(404).json({ error: 'No encontrada' });
    res.json(upd);
  } catch (e) { next(e); }
});

/**
 * Transición del ciclo de vida.
 * PATCH /api/tarifas-cliente/:id/estado
 * body: { estado: 'generada'|'emitida'|'enviada'|'validacion'|'archivada',
 *         nota?, extra?: { firma, doc_agencia_url, doc_cliente_url, verificacion_reporte } }
 */
r.patch('/:id/estado', async (req, res, next) => {
  try {
    const { estado, nota, extra } = req.body;
    const upd = await tarifasClienteRepo.avanzarEstado(req.params.id, estado, {
      nota,
      extra,
      actor: req.user?.username,
    });
    if (!upd) return res.status(404).json({ error: 'No encontrada' });
    res.json(upd);
  } catch (e) { next(e); }
});

export default r;
