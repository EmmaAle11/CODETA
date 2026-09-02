import type { EstadoTarifa } from './types';

// Espejo de TRANSICIONES en backend/src/repositories/tarifasCliente.repo.js:
// lineal, un solo siguiente estado posible, sin ramas ni retrocesos. El backend
// sigue siendo quien valida; esto solo evita ofrecer un paso imposible.
const TRANSICIONES: Record<EstadoTarifa, EstadoTarifa | null> = {
  captura: 'generada',
  generada: 'emitida',
  emitida: 'enviada',
  enviada: 'validacion',
  validacion: 'archivada',
  archivada: null,
};

export function siguienteEstado(actual: EstadoTarifa): EstadoTarifa | null {
  return TRANSICIONES[actual];
}
