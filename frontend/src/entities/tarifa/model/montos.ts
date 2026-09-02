/**
 * Conversión entre el `rate` que guarda la base y el porcentaje que se muestra.
 *
 * La base guarda la fracción (NUMERIC(6,4)): 0.0145 = 1.45%. Multiplicar por
 * 100 en coma flotante binaria no da un número redondo —0.0145 * 100 arroja
 * 1.4500000000000002— y ese ruido acababa precargado en el formulario. Se
 * redondea a 4 decimales: cubre de sobra los 2 decimales de porcentaje que
 * NUMERIC(6,4) puede representar, sin truncar nada real.
 */
const DECIMALES_PCT = 4;

export function rateAPorcentaje(rate: number | null | undefined): string {
  if (rate == null) return '';
  const n = Number(rate);
  if (!Number.isFinite(n)) return '';
  const factor = 10 ** DECIMALES_PCT;
  return String(Math.round(n * 100 * factor) / factor);
}
