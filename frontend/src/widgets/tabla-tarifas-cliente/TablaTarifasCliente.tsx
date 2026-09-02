import { useEffect, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { TarifasAPI } from '../../entities/tarifa/api/tarifas';
import type { TarifaCliente } from '../../entities/tarifa/model/types';
import { Card } from '../../shared/ui/Card';
import { EstadoBadge } from '../../shared/ui/Badge';
import { BotonAvanzarEstado } from '../../features/avanzar-estado/BotonAvanzarEstado';

export type TablaTarifasClienteHandle = { recargar: () => void };

export const TablaTarifasCliente = forwardRef<
  TablaTarifasClienteHandle,
  { query?: Record<string, string>; mostrarAccion?: boolean; titulo: string; onCambio?: () => void }
>(({ query, mostrarAccion = false, titulo, onCambio }, ref) => {
  const [tarifas, setTarifas] = useState<TarifaCliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // El objeto `query` llega literal desde la página y sería una referencia nueva
  // en cada render; se estabiliza por su contenido para no recargar en bucle.
  const claveQuery = JSON.stringify(query ?? {});
  const filtros = useMemo(() => JSON.parse(claveQuery) as Record<string, string>, [claveQuery]);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    TarifasAPI.listarCliente(filtros)
      .then(setTarifas)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error inesperado'))
      .finally(() => setCargando(false));
  }, [filtros]);

  useEffect(() => { cargar(); }, [cargar]);
  useImperativeHandle(ref, () => ({ recargar: cargar }), [cargar]);

  return (
    <Card title={titulo}>
      {error && <div className="gt-error">{error}</div>}
      {cargando ? (
        <div className="gt-empty">Cargando…</div>
      ) : tarifas.length === 0 ? (
        <div className="gt-empty">No hay tarifas aquí todavía.</div>
      ) : (
        <div className="gt-tabla-scroll">
          <table className="gt-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>RFC</th>
                <th>Aduana</th>
                <th>Vigencia</th>
                <th>Estado</th>
                {mostrarAccion && <th>Acción</th>}
              </tr>
            </thead>
            <tbody>
              {tarifas.map((t) => (
                <tr key={t.id}>
                  <td>{t.cliente_razon_social}</td>
                  <td>{t.cliente_rfc}</td>
                  <td>{t.aduana} / {t.modalidad.toUpperCase()}</td>
                  <td>{t.vigencia_fin ? String(t.vigencia_fin).slice(0, 10) : '—'}</td>
                  <td><EstadoBadge estado={t.estado} /></td>
                  {mostrarAccion && (
                    <td><BotonAvanzarEstado tarifa={t} onAvanzada={() => { cargar(); onCambio?.(); }} /></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
});

TablaTarifasCliente.displayName = 'TablaTarifasCliente';
