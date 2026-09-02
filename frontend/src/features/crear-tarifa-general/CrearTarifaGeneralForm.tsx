import { useEffect, useState, type FormEvent } from 'react';
import { TarifasAPI } from '../../entities/tarifa/api/tarifas';
import { AduanasAPI } from '../../entities/aduana/api/aduanas';
import { rateAPorcentaje } from '../../entities/tarifa/model/montos';
import type { Modalidad, TipoOperacion, Concepto, TarifaGeneral } from '../../entities/tarifa/model/types';
import type { Aduana } from '../../entities/aduana/model/types';
import { Input, Select } from '../../shared/ui/Field';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { ConceptosEditor } from '../../shared/ui/ConceptosEditor';
import { AvisoFaltantes } from '../../shared/ui/Faltantes';

const GRUPOS_BASE = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ETIQUETA_TIPO: Record<string, string> = {
  maritima: 'Marítima', aerea: 'Aérea', fronteriza: 'Fronteriza', multimodal: 'Multimodal',
};

// NUMERIC(6,4) guarda el rate como fracción con 4 decimales: el paso mínimo
// representable es 0.0001 = 0.01%. Un porcentaje con más precisión que esa se
// redondea en la base sin avisar, así que se avisa aquí.
const PASO_MINIMO_PCT = 0.01;

/**
 * Alta y edición de una tarifa general. Es el mismo formulario en los dos
 * modos: con `tarifa` llega precargado y manda PATCH; sin ella, POST.
 *
 * En edición la llave de negocio (aduana + operación + modalidad) queda fija:
 * cambiarla convertiría la tarifa en otra distinta y chocaría con uq_tg_llave.
 */
export function CrearTarifaGeneralForm({
  tarifa, onGuardada, onCancelarEdicion,
}: {
  tarifa?: TarifaGeneral | null;
  onGuardada: () => void;
  onCancelarEdicion?: () => void;
}) {
  const editando = Boolean(tarifa);

  const [aduanas, setAduanas] = useState<Aduana[]>([]);
  const [aduanaId, setAduanaId] = useState('');
  const [tipoOperacion, setTipoOperacion] = useState<TipoOperacion>('importacion');
  const [modalidad, setModalidad] = useState<Modalidad>('fcl');
  const [honorariosModo, setHonorariosModo] = useState<'porcentaje' | 'flat'>('porcentaje');
  const [porcentaje, setPorcentaje] = useState('');
  const [minimo, setMinimo] = useState('');
  const [flat, setFlat] = useState('');
  const [baseCalculo, setBaseCalculo] = useState('');
  const [servicios, setServicios] = useState<Concepto[]>([]);
  const [cargos, setCargos] = useState<Concepto[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => { AduanasAPI.listar().then(setAduanas).catch(() => setAduanas([])); }, []);

  // Precarga en modo edición. Depende del id, no del objeto, para no pisar lo
  // que el usuario ya escribió cada vez que la tabla se recarga y crea una
  // referencia nueva con los mismos datos.
  useEffect(() => {
    if (!tarifa) return;
    setTipoOperacion(tarifa.tipo_operacion);
    setModalidad(tarifa.modalidad);
    setHonorariosModo(tarifa.honorarios_modo);
    setPorcentaje(rateAPorcentaje(tarifa.honorarios_rate));
    setMinimo(tarifa.honorarios_minimo != null ? String(tarifa.honorarios_minimo) : '');
    setFlat(tarifa.honorarios_flat != null ? String(tarifa.honorarios_flat) : '');
    setBaseCalculo(tarifa.honorarios_base ?? '');
    setServicios(tarifa.servicios_conceptos ?? []);
    setCargos(tarifa.cargos_adicionales ?? []);
    setError(null); setOk(null);
  }, [tarifa?.id]);

  const aduanaElegida = aduanas.find((a) => a.id === aduanaId);
  const nombreAduana = editando ? tarifa!.aduana : aduanaElegida?.nombre;
  // El transporte aéreo solo maneja LCL — la modalidad se fija sola.
  const esAerea = editando ? false : aduanaElegida?.tipo === 'aerea';
  useEffect(() => { if (esAerea) setModalidad('lcl'); }, [esAerea]);

  const porTipo = aduanas.reduce<Record<string, Aduana[]>>((acc, a) => {
    (acc[a.tipo] ??= []).push(a);
    return acc;
  }, {});

  // Qué falta para poder guardar. Es la MISMA lista que apaga el botón, para
  // que nunca haya un botón inerte sin explicación.
  const faltantes: string[] = [];
  if (!nombreAduana) faltantes.push('la aduana');
  if (honorariosModo === 'porcentaje' && !porcentaje.trim()) faltantes.push('el porcentaje de honorarios');
  if (honorariosModo === 'flat' && !flat.trim()) faltantes.push('la tarifa flat de honorarios');

  const pctNumero = Number(porcentaje);
  const perderaPrecision =
    honorariosModo === 'porcentaje' && porcentaje.trim() !== '' && Number.isFinite(pctNumero) &&
    Math.abs(pctNumero * 100 - Math.round(pctNumero * 100)) > 1e-9;

  const listo = faltantes.length === 0;

  function limpiar() {
    setAduanaId(''); setPorcentaje(''); setMinimo(''); setFlat(''); setBaseCalculo('');
    setServicios([]); setCargos([]);
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!listo) return;
    setError(null); setOk(null); setEnviando(true);

    const montos = {
      honorarios_modo: honorariosModo,
      honorarios_rate: honorariosModo === 'porcentaje' && porcentaje ? Number(porcentaje) / 100 : undefined,
      honorarios_minimo: honorariosModo === 'porcentaje' && minimo ? Number(minimo) : undefined,
      honorarios_flat: honorariosModo === 'flat' && flat ? Number(flat) : undefined,
      honorarios_base: honorariosModo === 'porcentaje' && baseCalculo ? baseCalculo : undefined,
      servicios_modo: 'porcentaje' as const,
      servicios_conceptos: servicios,
      cargos_adicionales: cargos,
    };

    try {
      if (editando) {
        await TarifasAPI.editarGeneral(tarifa!.id, montos);
        setOk('Tarifa general actualizada. Las tarifas de cliente ya creadas conservan sus valores.');
      } else {
        await TarifasAPI.crearGeneral({
          aduana: nombreAduana!,
          tipo_operacion: tipoOperacion,
          modalidad,
          ...montos,
        });
        setOk('Tarifa general creada correctamente.');
        limpiar();
      }
      onGuardada();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card
      title={editando ? `Editar Tarifa General · ${tarifa!.aduana}` : 'Crear Tarifa General'}
      acciones={editando && onCancelarEdicion
        ? <Button type="button" variant="ghost" onClick={onCancelarEdicion}>Cancelar edición</Button>
        : undefined}
    >
      <form onSubmit={enviar}>
        {error && <div className="gt-error">{error}</div>}
        {ok && <div className="gt-success">{ok}</div>}
        {editando && (
          <div className="gt-aviso">
            Editar esta tarifa <strong>no cambia</strong> las tarifas de cliente ya creadas a partir
            de ella: cada una guardó una copia de los montos al generarse. El cambio aplica a las
            tarifas de cliente que se creen a partir de ahora.
          </div>
        )}

        <div className="gt-row">
          {editando ? (
            <Input label="Aduana" value={tarifa!.aduana} disabled hint="La llave de la tarifa no se puede cambiar." />
          ) : (
            <Select label="Aduana" value={aduanaId} onChange={(e) => setAduanaId(e.target.value)}>
              <option value="">Elige una aduana…</option>
              {Object.entries(porTipo).map(([tipo, lista]) => (
                <optgroup key={tipo} label={ETIQUETA_TIPO[tipo] ?? tipo}>
                  {lista.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </optgroup>
              ))}
            </Select>
          )}
          <Select label="Tipo de operación" value={tipoOperacion} disabled={editando}
                  onChange={(e) => setTipoOperacion(e.target.value as TipoOperacion)}>
            <option value="importacion">Importación</option>
            <option value="exportacion">Exportación</option>
          </Select>
          <Select label="Modalidad" value={modalidad} disabled={editando || esAerea}
                  onChange={(e) => setModalidad(e.target.value as Modalidad)}
                  hint={esAerea ? 'El transporte aéreo únicamente maneja LCL.' : undefined}>
            <option value="fcl">FCL</option>
            <option value="lcl">LCL</option>
          </Select>
        </div>

        <div className="gt-row">
          <Select label="Cálculo de honorarios" value={honorariosModo}
                  onChange={(e) => setHonorariosModo(e.target.value as 'porcentaje' | 'flat')}>
            <option value="porcentaje">Por porcentaje</option>
            <option value="flat">Tarifa flat</option>
          </Select>
          {honorariosModo === 'porcentaje' ? (
            <>
              <Input label="Porcentaje (%)" type="number" step="0.01" min="0" value={porcentaje}
                     onChange={(e) => setPorcentaje(e.target.value)} placeholder="Ej. 1.45"
                     hint={`Se guarda con precisión de ${PASO_MINIMO_PCT}%.`} />
              <Input label="Tarifa mínima (MXN)" type="number" step="0.01" min="0" value={minimo}
                     onChange={(e) => setMinimo(e.target.value)} />
            </>
          ) : (
            <Input label="Tarifa flat (MXN)" type="number" step="0.01" min="0" value={flat}
                   onChange={(e) => setFlat(e.target.value)} />
          )}
        </div>

        {perderaPrecision && (
          <div className="gt-aviso">
            El porcentaje se guarda con dos decimales ({PASO_MINIMO_PCT}% de precisión):
            {' '}<strong>{porcentaje}%</strong> se redondeará a <strong>{(Math.round(pctNumero * 100) / 100).toFixed(2)}%</strong>.
          </div>
        )}

        {honorariosModo === 'porcentaje' && (
          <div className="gt-row">
            <Select label="Base para el cálculo (grupo, opcional)" value={baseCalculo}
                    onChange={(e) => setBaseCalculo(e.target.value)}>
              <option value="">Sin definir</option>
              {GRUPOS_BASE.map((g) => <option key={g} value={g}>Grupo {g}</option>)}
            </Select>
          </div>
        )}

        <ConceptosEditor etiqueta="Servicios complementarios" modo="porcentaje" conceptos={servicios} onChange={setServicios} />
        <ConceptosEditor etiqueta="Cargos adicionales" modo="flat" conceptos={cargos} onChange={setCargos} />

        <AvisoFaltantes faltantes={faltantes} />
        <Button type="submit" disabled={enviando || !listo}>
          {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear Tarifa General'}
        </Button>
      </form>
    </Card>
  );
}
