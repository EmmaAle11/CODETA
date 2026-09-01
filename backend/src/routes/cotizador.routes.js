import { Router } from 'express';
import { resolverTarifaParaCotizador } from '../services/cotizador.service.js';

const r = Router();

/**
 * Endpoint que consume el Cotizador (QuoteForm.tsx) para reemplazar sus
 * rate/min hardcodeados por datos reales del Gestor de Tarifas.
 *
 * GET /api/cotizador/resolver?aduana=&tipoOperacion=&modalidadEnvio=&tipoMercancia=
 *
 * Nota de performance (ver JSON de contexto): el Cotizador debe cachear esta
 * respuesta al cargar el formulario, no llamarla en cada tecleo.
 */
r.get('/resolver', async (req, res, next) => {
  try {
    const { aduana, tipoOperacion, modalidadEnvio, tipoMercancia } = req.query;
    if (!aduana || !tipoOperacion) {
      return res.status(400).json({ error: 'Faltan parámetros: aduana y tipoOperacion son obligatorios' });
    }
    const data = await resolverTarifaParaCotizador({ aduana, tipoOperacion, modalidadEnvio, tipoMercancia });
    res.json(data);
  } catch (e) { next(e); }
});

export default r;
