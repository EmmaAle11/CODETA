/**
 * Error de negocio con un mensaje que SÍ se le muestra al usuario.
 *
 * errorHandler responde `err.publicMessage || 'Error interno'`, así que un
 * error sin publicMessage llega al frontend como "Error interno" aunque traiga
 * el status correcto.
 */
export function errorDeNegocio(status, publicMessage) {
  const e = new Error(publicMessage);
  e.status = status;
  e.publicMessage = publicMessage;
  return e;
}

/**
 * Traduce la violación de una restricción única de Postgres (23505) a un 409
 * legible. Devuelve null si el error es otra cosa, para volver a lanzarlo tal
 * cual: solo se traduce lo que se reconoce.
 */
export function conflictoPorUnico(e, restriccion, mensaje) {
  return e?.code === '23505' && e?.constraint === restriccion
    ? errorDeNegocio(409, mensaje)
    : null;
}
