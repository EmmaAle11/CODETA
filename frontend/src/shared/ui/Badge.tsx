import type { EstadoTarifa } from '../../entities/tarifa/model/types';

// Las 6 etapas del ciclo, con su número de paso: el tablero se lee de un
// vistazo sin abrir el expediente.
const ETIQUETA: Record<EstadoTarifa, string> = {
  captura: 'Captura',
  generada: 'Generada',
  emitida: 'Emitida',
  enviada: 'Enviada',
  validacion: 'En validación',
  archivada: 'Archivada',
};

const PASO: Record<EstadoTarifa, number> = {
  captura: 1, generada: 2, emitida: 3, enviada: 4, validacion: 5, archivada: 6,
};

export function EstadoBadge({ estado }: { estado: EstadoTarifa }) {
  return (
    <span className={`gt-badge gt-badge--${estado}`}>
      {ETIQUETA[estado]} <span className="gt-badge__paso">{PASO[estado]}/6</span>
    </span>
  );
}
