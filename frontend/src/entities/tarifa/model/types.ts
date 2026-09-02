// Modelo de la entidad Tarifa, espejo del esquema `tarifas` del backend
// (db/migrations/001_schema.sql).
export type TipoOperacion = 'importacion' | 'exportacion';
export type Modalidad = 'fcl' | 'lcl';
export type NivelPartner = 'directo' | 'socio' | 'corresponsalia';

/** Ciclo de vida lineal; la legalidad de cada paso la valida el backend. */
export type EstadoTarifa =
  | 'captura' | 'generada' | 'emitida' | 'enviada' | 'validacion' | 'archivada';

export interface Concepto { concepto: string; rate?: number; minimo?: number; monto?: number }

/** Llave de negocio: 3 dimensiones. */
export interface LlaveTarifa {
  aduana: string;
  tipo_operacion: TipoOperacion;
  modalidad: Modalidad;
}

/** Montos, compartidos por la tarifa general y la de cliente. */
export interface MontosTarifa {
  honorarios_modo: 'porcentaje' | 'flat';
  honorarios_rate?: number | null;
  honorarios_minimo?: number | null;
  honorarios_flat?: number | null;
  honorarios_base?: string | null;
  servicios_modo: 'porcentaje' | 'flat';
  servicios_conceptos: Concepto[];
  servicios_flat?: number | null;
  servicios_base?: string | null;
  cargos_adicionales: Concepto[];
}

export interface TarifaGeneral extends LlaveTarifa, MontosTarifa {
  id: string;
  activo: boolean;
}

/** La 4ª variable —el RFC— es lo que hace única a una tarifa por cliente. */
export interface TarifaCliente extends LlaveTarifa, MontosTarifa {
  id: string;
  tarifa_general_id?: string | null;
  cliente_rfc: string;
  cliente_razon_social: string;
  partner_activo: boolean;
  partner_nivel: NivelPartner;
  partner_datos: Record<string, unknown>;
  vigencia_tipo?: '6m' | '1a' | 'manual' | null;
  vigencia_inicio?: string | null;
  vigencia_fin?: string | null;
  estado: EstadoTarifa;
  historial?: { estado: EstadoTarifa; nota?: string; actor?: string; fecha: string }[];
}

/** Contrato que consume el Cotizador (QuoteForm.tsx del monolito). */
export interface TarifaResuelta {
  encontrada: boolean;
  aduana: string;
  honorarios: { rate: number; min: number } | null;
  serviciosComplementarios: { rate: number; min: number } | null;
  conceptosFijos: {
    validacion: number; previo: number; sellosFiscales: number;
    cnt: number; vucem: number; reconocimientoAduanero: number;
  } | null;
}
