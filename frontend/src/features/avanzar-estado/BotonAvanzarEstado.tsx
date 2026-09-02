import { useState } from 'react';
import { TarifasAPI } from '../../entities/tarifa/api/tarifas';
import type { EstadoTarifa, TarifaCliente } from '../../entities/tarifa/model/types';
import { siguienteEstado } from '../../entities/tarifa/model/ciclo';
import { Button } from '../../shared/ui/Button';
import { EmitirTarifaModal } from '../emitir-tarifa/EmitirTarifaModal';

const ETIQUETA_ACCION: Record<EstadoTarifa, string> = {
  captura: 'Generar tarifa',
  generada: 'Emitir tarifa',
  emitida: 'Enviar al cliente',
  enviada: 'Recibir y validar',
  validacion: 'Archivar',
  archivada: '',
};

// Emitir es el único paso que necesita datos adicionales (firma, correo) antes
// de avanzar — los demás solo mueven la etapa.
export function BotonAvanzarEstado({ tarifa, onAvanzada }: { tarifa: TarifaCliente; onAvanzada: () => void }) {
  const { id, estado } = tarifa;
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalEmitir, setModalEmitir] = useState(false);
  const siguiente = siguienteEstado(estado);

  if (!siguiente) return <span className="gt-empty">Ciclo completo</span>;

  async function avanzar() {
    setEnviando(true);
    setError(null);
    try {
      await TarifasAPI.avanzarEstado(id, siguiente as EstadoTarifa);
      onAvanzada();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => (estado === 'generada' ? setModalEmitir(true) : avanzar())}
        disabled={enviando}
      >
        {enviando ? 'Avanzando…' : ETIQUETA_ACCION[estado]}
      </Button>
      {error && <div className="gt-error">{error}</div>}
      {modalEmitir && (
        <EmitirTarifaModal
          tarifa={tarifa}
          onCancelar={() => setModalEmitir(false)}
          onEmitida={() => { setModalEmitir(false); onAvanzada(); }}
        />
      )}
    </>
  );
}
