import { useEffect, useState, type FormEvent } from 'react';
import { TarifasAPI } from '../../entities/tarifa/api/tarifas';
import { rateAPorcentaje } from '../../entities/tarifa/model/montos';
import type { Concepto, NivelPartner, TarifaGeneral } from '../../entities/tarifa/model/types';
import { Input, Select } from '../../shared/ui/Field';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { Switch } from '../../shared/ui/Switch';
import { ConceptosEditor } from '../../shared/ui/ConceptosEditor';
import { AvisoFaltantes } from '../../shared/ui/Faltantes';

const GRUPOS_BASE = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
type VigenciaTipo = '6m' | '1a' | 'manual';

/**
 * setMonth() por sí solo desborda cuando el mes destino tiene menos días
 * (31 de agosto + 6 meses "es" 31 de febrero, que no existe, y JS lo recorre al
 * 3 de marzo). Se fija primero al día 1 para evitar el desborde y luego se
 * recorta al último día real del mes destino si hace falta.
 */
function sumarMeses(fecha: Date, meses: number) {
  const d = new Date(fecha);
  const diaOriginal = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + meses);
  const ultimoDiaDestino = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(diaOriginal, ultimoDiaDestino));
  return fechaISO(d);
}

// toISOString() convierte a UTC y en México (UTC-6) eso retrocede un día para
// cualquier hora local antes de las 06:00. Se compone la fecha local a mano.
function fechaISO(d: Date) {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// RFC de persona moral: 12 caracteres. Persona física: 13.
const RFC_LONGITUDES = [12, 13];

export function CrearTarifaClienteForm({ onCreada }: { onCreada: () => void }) {
  const [generales, setGenerales] = useState<TarifaGeneral[]>([]);
  const [generalId, setGeneralId] = useState('');
  const [rfc, setRfc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');

  const [honorariosModo, setHonorariosModo] = useState<'porcentaje' | 'flat'>('porcentaje');
  const [porcentaje, setPorcentaje] = useState('');
  const [minimo, setMinimo] = useState('');
  const [flat, setFlat] = useState('');
  const [baseCalculo, setBaseCalculo] = useState('');
  const [servicios, setServicios] = useState<Concepto[]>([]);
  const [cargos, setCargos] = useState<Concepto[]>([]);

  const [vigenciaTipo, setVigenciaTipo] = useState<VigenciaTipo | ''>('');
  const [vigenciaFinManual, setVigenciaFinManual] = useState('');

  const [partnerActivo, setPartnerActivo] = useState(false);
  const [partnerNivel, setPartnerNivel] = useState<NivelPartner>('socio');
  const [corresRazonSocial, setCorresRazonSocial] = useState('');
  const [corresAlias, setCorresAlias] = useState('');
  const [agenteNombre, setAgenteNombre] = useState('');
  const [agentePatente, setAgentePatente] = useState('');
  const [agenteRfc, setAgenteRfc] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => { TarifasAPI.listarGenerales().then(setGenerales).catch(() => setGenerales([])); }, []);
  const base = generales.find((g) => g.id === generalId);

  // Al elegir la tarifa general se heredan sus montos como punto de partida;
  // desde ahí se personalizan. Lo que se guarda es una COPIA: editar después la
  // tarifa general no altera esta.
  useEffect(() => {
    if (!base) return;
    setHonorariosModo(base.honorarios_modo);
    setPorcentaje(rateAPorcentaje(base.honorarios_rate));
    setMinimo(base.honorarios_minimo != null ? String(base.honorarios_minimo) : '');
    setFlat(base.honorarios_flat != null ? String(base.honorarios_flat) : '');
    setBaseCalculo(base.honorarios_base ?? '');
    setServicios(base.servicios_conceptos ?? []);
    setCargos(base.cargos_adicionales ?? []);
  }, [base?.id]);

  const hoy = new Date();
  const vigenciaInicio = fechaISO(hoy);
  const limiteManual = sumarMeses(hoy, 12);
  const vigenciaFin =
    vigenciaTipo === '6m' ? sumarMeses(hoy, 6) :
    vigenciaTipo === '1a' ? sumarMeses(hoy, 12) :
    vigenciaTipo === 'manual' ? vigenciaFinManual : '';

  const rfcLimpio = rfc.trim().toUpperCase();

  const faltantes: string[] = [];
  if (!base) faltantes.push('la tarifa general de la que parte');
  if (!rfcLimpio) faltantes.push('el RFC del cliente');
  else if (!RFC_LONGITUDES.includes(rfcLimpio.length)) faltantes.push('un RFC válido (12 caracteres para persona moral, 13 para física)');
  if (!razonSocial.trim()) faltantes.push('la razón social');
  if (vigenciaTipo === 'manual' && !vigenciaFinManual) faltantes.push('la fecha de fin de vigencia');
  if (vigenciaTipo === 'manual' && vigenciaFinManual && vigenciaFinManual > limiteManual) faltantes.push(`una vigencia que no pase de ${limiteManual} (máximo 12 meses)`);
  if (partnerActivo && partnerNivel === 'corresponsalia' && !corresRazonSocial.trim()) faltantes.push('la razón social de la corresponsalía');

  const listo = faltantes.length === 0;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!listo || !base) return;
    setError(null); setOk(false); setEnviando(true);
    try {
      const partnerDatos = partnerActivo && partnerNivel === 'corresponsalia'
        ? { razonSocial: corresRazonSocial, alias: corresAlias, agente: { nombre: agenteNombre, patente: agentePatente, rfc: agenteRfc } }
        : {};
      await TarifasAPI.crearCliente({
        tarifa_general_id: base.id,
        aduana: base.aduana,
        tipo_operacion: base.tipo_operacion,
        modalidad: base.modalidad,
        cliente_rfc: rfcLimpio,
        cliente_razon_social: razonSocial.trim(),
        honorarios_modo: honorariosModo,
        honorarios_rate: honorariosModo === 'porcentaje' && porcentaje ? Number(porcentaje) / 100 : undefined,
        honorarios_minimo: honorariosModo === 'porcentaje' && minimo ? Number(minimo) : undefined,
        honorarios_flat: honorariosModo === 'flat' && flat ? Number(flat) : undefined,
        honorarios_base: honorariosModo === 'porcentaje' && baseCalculo ? baseCalculo : undefined,
        servicios_modo: 'porcentaje',
        servicios_conceptos: servicios,
        cargos_adicionales: cargos,
        vigencia_tipo: vigenciaTipo || undefined,
        vigencia_inicio: vigenciaTipo ? vigenciaInicio : undefined,
        vigencia_fin: vigenciaTipo ? vigenciaFin : undefined,
        partner_activo: partnerActivo,
        partner_nivel: partnerActivo ? partnerNivel : 'directo',
        partner_datos: partnerDatos,
      });
      setOk(true);
      setGeneralId(''); setRfc(''); setRazonSocial('');
      setPartnerActivo(false); setVigenciaTipo(''); setVigenciaFinManual('');
      onCreada();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card title="Crear Tarifa por Cliente">
      <form onSubmit={enviar}>
        {error && <div className="gt-error">{error}</div>}
        {ok && <div className="gt-success">Tarifa de cliente creada correctamente.</div>}

        <div className="gt-row">
          <Select label="Parte de la tarifa general" value={generalId} onChange={(e) => setGeneralId(e.target.value)}>
            <option value="">Elige una tarifa general…</option>
            {generales.map((g) => (
              <option key={g.id} value={g.id}>
                {g.aduana} · {g.tipo_operacion === 'importacion' ? 'Importación' : 'Exportación'} · {g.modalidad.toUpperCase()}
              </option>
            ))}
          </Select>
          <Input label="RFC del cliente" value={rfc} onChange={(e) => setRfc(e.target.value)}
                 placeholder="ABC010203XY1" maxLength={13}
                 hint={rfcLimpio.length === 12 ? 'Persona moral' : rfcLimpio.length === 13 ? 'Persona física' : '12 caracteres = moral · 13 = física'} />
          <Input label="Razón social" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
        </div>

        {generales.length === 0 && (
          <div className="gt-aviso">
            No hay tarifas generales todavía. Crea una primero en «Tarifas Generales»: una tarifa de
            cliente siempre parte de una.
          </div>
        )}

        <div className="gt-row">
          <Select label="Cálculo de honorarios" value={honorariosModo}
                  onChange={(e) => setHonorariosModo(e.target.value as 'porcentaje' | 'flat')}>
            <option value="porcentaje">Por porcentaje</option>
            <option value="flat">Tarifa flat</option>
          </Select>
          {honorariosModo === 'porcentaje' ? (
            <>
              <Input label="Porcentaje (%)" type="number" step="0.01" min="0" value={porcentaje} onChange={(e) => setPorcentaje(e.target.value)} />
              <Input label="Tarifa mínima (MXN)" type="number" step="0.01" min="0" value={minimo} onChange={(e) => setMinimo(e.target.value)} />
            </>
          ) : (
            <Input label="Tarifa flat (MXN)" type="number" step="0.01" min="0" value={flat} onChange={(e) => setFlat(e.target.value)} />
          )}
        </div>

        {honorariosModo === 'porcentaje' && (
          <div className="gt-row">
            <Select label="Base para el cálculo (grupo, opcional)" value={baseCalculo} onChange={(e) => setBaseCalculo(e.target.value)}>
              <option value="">Sin definir</option>
              {GRUPOS_BASE.map((g) => <option key={g} value={g}>Grupo {g}</option>)}
            </Select>
          </div>
        )}

        <ConceptosEditor etiqueta="Servicios complementarios" modo="porcentaje" conceptos={servicios} onChange={setServicios} />
        <ConceptosEditor etiqueta="Cargos adicionales" modo="flat" conceptos={cargos} onChange={setCargos} />

        <div className="gt-panel">
          <div className="gt-row">
            <Select label="Vigencia" value={vigenciaTipo} onChange={(e) => setVigenciaTipo(e.target.value as VigenciaTipo | '')}>
              <option value="">Sin vigencia definida</option>
              <option value="6m">6 meses</option>
              <option value="1a">1 año</option>
              <option value="manual">Fecha manual</option>
            </Select>
            {vigenciaTipo === 'manual' ? (
              <Input label="Fin de vigencia" type="date" value={vigenciaFinManual} max={limiteManual}
                     onChange={(e) => setVigenciaFinManual(e.target.value)}
                     hint={`Máximo ${limiteManual} (12 meses).`} />
            ) : vigenciaTipo ? (
              <Input label="Fin de vigencia (calculado)" value={vigenciaFin} disabled
                     hint={`Inicia el ${vigenciaInicio}.`} />
            ) : null}
          </div>
        </div>

        <div className="gt-panel">
          <Switch label="Es tarifa de partner / corresponsalía" checked={partnerActivo} onChange={setPartnerActivo} />
          {partnerActivo && (
            <>
              <div className="gt-row" style={{ marginTop: 12 }}>
                <Select label="Nivel" value={partnerNivel} onChange={(e) => setPartnerNivel(e.target.value as NivelPartner)}>
                  <option value="directo">Directo</option>
                  <option value="socio">Socio comercial</option>
                  <option value="corresponsalia">Corresponsalía</option>
                </Select>
              </div>
              {partnerNivel === 'corresponsalia' && (
                <>
                  <div className="gt-row">
                    <Input label="Razón social de la corresponsalía" value={corresRazonSocial} onChange={(e) => setCorresRazonSocial(e.target.value)} />
                    <Input label="Alias (opcional)" value={corresAlias} onChange={(e) => setCorresAlias(e.target.value)} />
                  </div>
                  <div className="gt-row">
                    <Input label="Agente aduanal" value={agenteNombre} onChange={(e) => setAgenteNombre(e.target.value)} />
                    <Input label="Patente" value={agentePatente} onChange={(e) => setAgentePatente(e.target.value)} />
                    <Input label="RFC del agente" value={agenteRfc} onChange={(e) => setAgenteRfc(e.target.value)} />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <AvisoFaltantes faltantes={faltantes} />
        <Button type="submit" disabled={enviando || !listo}>
          {enviando ? 'Guardando…' : 'Crear Tarifa por Cliente'}
        </Button>
      </form>
    </Card>
  );
}
