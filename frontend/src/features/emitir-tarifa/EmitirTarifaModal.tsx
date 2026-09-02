import { useState } from 'react';
import { TarifasAPI } from '../../entities/tarifa/api/tarifas';
import type { TarifaCliente } from '../../entities/tarifa/model/types';
import { Input } from '../../shared/ui/Field';
import { Button } from '../../shared/ui/Button';
import { AvisoFaltantes } from '../../shared/ui/Faltantes';

// RFC de 13 caracteres = persona física, se representa a sí misma. RFC de 12 =
// persona moral, firma un representante legal. Mismo criterio que la guía de uso.
function esPersonaMoral(rfc: string) {
  return rfc.trim().length === 12;
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Emitir es el único paso del ciclo que captura datos propios: correo del
 * cliente y las dos firmas. Viajan como `extra.firma` (JSONB) en la misma
 * transición que mueve el estado a 'emitida'.
 */
export function EmitirTarifaModal({
  tarifa, onEmitida, onCancelar,
}: {
  tarifa: TarifaCliente;
  onEmitida: () => void;
  onCancelar: () => void;
}) {
  const moral = esPersonaMoral(tarifa.cliente_rfc);
  const [correo, setCorreo] = useState('');
  const [agenciaNombre, setAgenciaNombre] = useState('');
  const [agenciaCargo, setAgenciaCargo] = useState('');
  const [clienteNombre, setClienteNombre] = useState(moral ? '' : tarifa.cliente_razon_social);
  const [clienteCargo, setClienteCargo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lo que falta para poder emitir. Es la MISMA lista que apaga el botón: sin
  // esto el botón quedaba inerte sin decir por qué, que fue el bug reportado.
  const faltantes: string[] = [];
  if (!correo.trim()) faltantes.push('el correo del cliente');
  else if (!CORREO.test(correo.trim())) faltantes.push('un correo válido');
  if (!agenciaNombre.trim()) faltantes.push('el nombre del representante de la agencia');
  if (!agenciaCargo.trim()) faltantes.push('el cargo del representante de la agencia');
  if (!clienteNombre.trim()) faltantes.push(moral ? 'el nombre del representante legal del cliente' : 'el nombre del titular');
  if (moral && !clienteCargo.trim()) faltantes.push('el cargo del representante legal');

  const listo = faltantes.length === 0;

  async function emitir() {
    if (!listo) return;
    setEnviando(true);
    setError(null);
    try {
      await TarifasAPI.avanzarEstado(tarifa.id, 'emitida', undefined, {
        firma: {
          clienteEmail: correo.trim(),
          esPersonaMoral: moral,
          agenciaRep: { nombre: agenciaNombre.trim(), cargo: agenciaCargo.trim() },
          clienteRep: { nombre: clienteNombre.trim(), cargo: moral ? clienteCargo.trim() : 'Titular' },
        },
      });
      onEmitida();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="gt-modal-backdrop" onClick={onCancelar}>
      <div className="gt-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className="gt-modal__title">Emitir tarifa · Datos de firma</h3>
        <p className="gt-modal__hint">
          {tarifa.cliente_razon_social} · {tarifa.cliente_rfc} · {moral ? 'Persona Moral' : 'Persona Física'}
        </p>

        {error && <div className="gt-error">{error}</div>}

        <Input label="Correo electrónico del cliente" type="email" value={correo}
               onChange={(e) => setCorreo(e.target.value)} placeholder="cliente@empresa.mx" />

        <div className="gt-panel">
          <strong style={{ fontSize: 13 }}>Firma 1 · Por la agencia</strong>
          <div className="gt-row" style={{ marginTop: 8, marginBottom: 0 }}>
            <Input label="Nombre del representante" value={agenciaNombre} onChange={(e) => setAgenciaNombre(e.target.value)} />
            <Input label="Cargo" value={agenciaCargo} onChange={(e) => setAgenciaCargo(e.target.value)} />
          </div>
        </div>

        <div className="gt-panel">
          <strong style={{ fontSize: 13 }}>Firma 2 · Por el cliente</strong>
          {moral ? (
            <>
              <p className="gt-field__hint" style={{ margin: '4px 0 8px' }}>
                RFC de 12 caracteres: firma el representante legal.
              </p>
              <div className="gt-row" style={{ marginBottom: 0 }}>
                <Input label="Nombre del representante legal" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} />
                <Input label="Cargo" value={clienteCargo} onChange={(e) => setClienteCargo(e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <p className="gt-field__hint" style={{ margin: '4px 0 8px' }}>
                RFC de 13 caracteres: persona física, firma directamente el titular.
              </p>
              <div className="gt-row" style={{ marginBottom: 0 }}>
                <Input label="Nombre del titular" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} />
              </div>
            </>
          )}
        </div>

        <AvisoFaltantes faltantes={faltantes} />

        <div className="gt-modal__actions">
          <Button type="button" variant="ghost" onClick={onCancelar}>Cancelar</Button>
          <Button type="button" onClick={emitir} disabled={!listo || enviando}>
            {enviando ? 'Emitiendo…' : 'Emitir tarifa'}
          </Button>
        </div>
      </div>
    </div>
  );
}
