import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { TarifasAPI } from '../../entities/tarifa/api/tarifas';
import type { TarifaGeneral } from '../../entities/tarifa/model/types';
import { Card } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';

export type TablaTarifasGeneralesHandle = { recargar: () => void };

function formatoHonorarios(t: TarifaGeneral) {
  if (t.honorarios_modo === 'flat') return `$${Number(t.honorarios_flat ?? 0).toLocaleString('es-MX')}`;
  const pct = Number(t.honorarios_rate ?? 0) * 100;
  const min = Number(t.honorarios_minimo ?? 0);
  // El "(mín. $0)" solo se muestra si de verdad se capturó un mínimo: si no,
  // daba a entender que el mínimo real era cero.
  return `${pct.toFixed(2)}%${min ? ` (mín. $${min.toLocaleString('es-MX')})` : ''}`;
}

export const TablaTarifasGenerales = forwardRef<
  TablaTarifasGeneralesHandle,
  { onEditar?: (t: TarifaGeneral) => void; editandoId?: string | null }
>(({ onEditar, editandoId }, ref) => {
  const [tarifas, setTarifas] = useState<TarifaGeneral[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    TarifasAPI.listarGenerales()
      .then(setTarifas)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error inesperado'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useImperativeHandle(ref, () => ({ recargar: cargar }), [cargar]);

  return (
    <Card title="Tarifas Generales">
      {error && <div className="gt-error">{error}</div>}
      {cargando ? (
        <div className="gt-empty">Cargando…</div>
      ) : tarifas.length === 0 ? (
        <div className="gt-empty">Todavía no hay tarifas generales.</div>
      ) : (
        <div className="gt-tabla-scroll">
          <table className="gt-table">
            <thead>
              <tr>
                <th>Aduana</th>
                <th>Operación</th>
                <th>Modalidad</th>
                <th>Honorarios</th>
                <th>Base</th>
                {onEditar && <th>Acción</th>}
              </tr>
            </thead>
            <tbody>
              {tarifas.map((t) => (
                <tr key={t.id}>
                  <td>{t.aduana}</td>
                  <td>{t.tipo_operacion === 'importacion' ? 'Importación' : 'Exportación'}</td>
                  <td>{t.modalidad.toUpperCase()}</td>
                  <td>{formatoHonorarios(t)}</td>
                  <td>{t.honorarios_base ? `Grupo ${t.honorarios_base}` : '—'}</td>
                  {onEditar && (
                    <td>
                      <Button type="button" variant="ghost" onClick={() => onEditar(t)} disabled={editandoId === t.id}>
                        {editandoId === t.id ? 'Editando…' : 'Editar'}
                      </Button>
                    </td>
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

TablaTarifasGenerales.displayName = 'TablaTarifasGenerales';
