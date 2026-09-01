// Manejo centralizado de errores. Normaliza la respuesta JSON.
export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) console.error('[GT]', err);
  res.status(status).json({
    error: err.publicMessage || 'Error interno',
    detalle: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
}

export class HttpError extends Error {
  constructor(status, publicMessage) {
    super(publicMessage);
    this.status = status;
    this.publicMessage = publicMessage;
  }
}
