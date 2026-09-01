import { tarifasGeneralesRepo } from '../repositories/tarifasGenerales.repo.js';

/**
 * Punto de integración con el Cotizador (QuoteForm.tsx del monolito SIPCA).
 *
 * Dado {aduana, tipoOperacion, modalidadEnvio, tipoMercancia} devuelve el
 * contrato que el useMemo `totals` del Cotizador espera para reemplazar sus
 * rate/min hardcodeados:
 *
 *   { honorarios:{rate,min}, serviciosComplementarios:{rate,min},
 *     conceptosFijos:{validacion, previo, sellosFiscales, cnt, vucem, reconocimientoAduanero} }
 *
 * Ver: cotizador-contexto-para-gestor-tarifas.json → "punto_de_integracion_recomendado".
 */
export async function resolverTarifaParaCotizador({ aduana, tipoOperacion, modalidadEnvio, tipoMercancia }) {
  const tg = await tarifasGeneralesRepo.porLlave({
    aduana,
    operacion: normalizaOperacion(tipoOperacion),
    modalidad: (modalidadEnvio || 'fcl').toLowerCase(),
  });

  if (!tg) {
    return { encontrada: false, aduana, honorarios: null, serviciosComplementarios: null, conceptosFijos: null };
  }

  // Honorarios (rate/min). Si la tarifa es flat, se expone min = flat y rate = 0.
  const honorarios = tg.honorarios_modo === 'flat'
    ? { rate: 0, min: Number(tg.honorarios_flat) || 0 }
    : { rate: Number(tg.honorarios_rate) || 0, min: Number(tg.honorarios_minimo) || 0 };

  // Servicios complementarios: se elige el concepto que corresponde al tipoMercancia,
  // si la agencia lo modeló por mercancía; si no, se usa el genérico.
  const serviciosComplementarios = resolverServicios(tg, tipoMercancia);

  // Conceptos fijos derivados de cargos_adicionales (lista configurable por aduana)
  const conceptosFijos = mapearConceptosFijos(tg.cargos_adicionales || []);

  return { encontrada: true, aduana, honorarios, serviciosComplementarios, conceptosFijos };
}

function normalizaOperacion(op) {
  const v = (op || '').toLowerCase();
  if (v.startsWith('import')) return 'importacion';
  if (v.startsWith('export')) return 'exportacion';
  return v;
}

function resolverServicios(tg, tipoMercancia) {
  if (tg.servicios_modo === 'flat') {
    return { rate: 0, min: Number(tg.servicios_flat) || 0 };
  }
  const conceptos = Array.isArray(tg.servicios_conceptos) ? tg.servicios_conceptos : [];
  const match =
    conceptos.find((c) => (c.concepto || '').toLowerCase() === (tipoMercancia || '').toLowerCase()) ||
    conceptos.find((c) => (c.concepto || '').toLowerCase().includes('general')) ||
    conceptos[0];
  return match
    ? { rate: Number(match.rate) || 0, min: Number(match.minimo) || 0 }
    : { rate: 0, min: 0 };
}

// Normaliza la lista libre de cargos a las claves que consume applySuggestedFees.
function mapearConceptosFijos(cargos) {
  const buscar = (...alias) => {
    const c = cargos.find((x) =>
      alias.some((a) => (x.concepto || '').toLowerCase().includes(a))
    );
    return c ? Number(c.monto) || 0 : 0;
  };
  return {
    validacion:            buscar('validaci'),
    previo:                buscar('previo', 'reconocimiento previo'),
    sellosFiscales:        buscar('sello'),
    cnt:                   buscar('cnt', 'contraprestaci'),
    vucem:                 buscar('vucem', 'cove'),
    reconocimientoAduanero: buscar('reconocimiento aduanero'),
  };
}
