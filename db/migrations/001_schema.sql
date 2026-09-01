-- ============================================================================
-- GT · Constructor de Tarifas Aduanales
-- Migración 001 — Esquema base
--
-- Convención alineada al monolito SIPCA/Doxia: se usa un esquema propio por
-- dominio (igual que `comercial.quotes`). Aquí el dominio es `tarifas`.
-- Las 4 dimensiones (aduana, operación, modalidad, mercancía) coinciden con
-- las columnas de `comercial.quotes`, para que la llave de búsqueda del
-- Cotizador sea la misma.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS tarifas;

-- Extensión para UUIDs (si el monolito ya la tiene, este IF NOT EXISTS no daña)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- Catálogo de aduanas / puntos de despacho
-- Alta/baja libre (no es un enum cerrado), tal como pide la referencia de dominio.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tarifas.aduanas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL UNIQUE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('maritima','aerea','fronteriza','multimodal')),
  subgrupo    TEXT,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Tarifas Generales (plantillas de cobro por aduana)
-- Llave de negocio: aduana + operación + modalidad
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tarifas.tarifas_generales (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aduana                   TEXT NOT NULL,
  tipo_operacion           TEXT NOT NULL CHECK (tipo_operacion IN ('importacion','exportacion')),
  modalidad                TEXT NOT NULL CHECK (modalidad IN ('fcl','lcl')),

  -- Honorarios (porcentaje con mínimo, o tarifa flat)
  honorarios_modo          TEXT NOT NULL DEFAULT 'porcentaje' CHECK (honorarios_modo IN ('porcentaje','flat')),
  honorarios_rate          NUMERIC(6,4),        -- ej. 0.0045 = 0.45%
  honorarios_minimo        NUMERIC(14,2),
  honorarios_flat          NUMERIC(14,2),
  honorarios_base          TEXT,                -- grupo de base de cálculo (A..H)

  -- Servicios complementarios (porcentaje con mínimo, o conceptos flat en jsonb)
  servicios_modo           TEXT NOT NULL DEFAULT 'porcentaje' CHECK (servicios_modo IN ('porcentaje','flat')),
  servicios_conceptos      JSONB NOT NULL DEFAULT '[]',   -- [{concepto,rate,minimo} | {concepto,monto}]
  servicios_flat           NUMERIC(14,2),
  servicios_base           TEXT,

  -- Cargos adicionales (conceptos fijos por trámite)
  cargos_adicionales       JSONB NOT NULL DEFAULT '[]',   -- [{concepto,monto}]

  activo                   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Una tarifa general por combinación de las 3 dimensiones
  CONSTRAINT uq_tg_llave UNIQUE (aduana, tipo_operacion, modalidad)
);

-- ----------------------------------------------------------------------------
-- Tarifas por Cliente (personalizadas)
-- Identidad = 3 variables + RFC (la 4ª variable que la hace única).
-- Incluye ciclo de vida, vigencia, datos de firma y documentos.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tarifas.tarifas_cliente (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarifa_general_id        UUID REFERENCES tarifas.tarifas_generales(id) ON DELETE SET NULL,

  -- 3 variables heredadas
  aduana                   TEXT NOT NULL,
  tipo_operacion           TEXT NOT NULL CHECK (tipo_operacion IN ('importacion','exportacion')),
  modalidad                TEXT NOT NULL CHECK (modalidad IN ('fcl','lcl')),

  -- Cliente (4ª variable = RFC)
  cliente_rfc              TEXT NOT NULL,
  cliente_razon_social     TEXT NOT NULL,
  -- Partner / nivel del target
  partner_activo           BOOLEAN NOT NULL DEFAULT FALSE,
  partner_nivel            TEXT CHECK (partner_nivel IN ('directo','socio','corresponsalia')) DEFAULT 'directo',
  partner_datos            JSONB DEFAULT '{}',   -- razón social partner, agente aduanal, patente, rfc agente

  -- Montos (misma forma que la tarifa general, ya personalizados)
  honorarios_modo          TEXT NOT NULL DEFAULT 'porcentaje',
  honorarios_rate          NUMERIC(6,4),
  honorarios_minimo        NUMERIC(14,2),
  honorarios_flat          NUMERIC(14,2),
  honorarios_base          TEXT,
  servicios_modo           TEXT NOT NULL DEFAULT 'porcentaje',
  servicios_conceptos      JSONB NOT NULL DEFAULT '[]',
  servicios_flat           NUMERIC(14,2),
  servicios_base           TEXT,
  cargos_adicionales       JSONB NOT NULL DEFAULT '[]',

  -- Vigencia (dato integral; inicia al generarse)
  vigencia_tipo            TEXT CHECK (vigencia_tipo IN ('6m','1a','manual')),
  vigencia_inicio          DATE,
  vigencia_fin             DATE,

  -- Ciclo de vida
  estado                   TEXT NOT NULL DEFAULT 'captura'
                             CHECK (estado IN ('captura','generada','emitida','enviada','validacion','archivada')),

  -- Datos de firma y correo (capturados al Emitir)
  firma                    JSONB DEFAULT NULL,   -- {clienteEmail, agenciaRep{...}, clienteRep{...}, esPersonaMoral}
  -- Documentos firmados (referencia a storage del monolito, p. ej. S3)
  doc_agencia_url          TEXT,                 -- firma1 (agencia)
  doc_cliente_url          TEXT,                 -- firma2 (cliente)
  verificacion_reporte     JSONB DEFAULT NULL,   -- reporte OCR campo por campo

  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsqueda por las 4 variables y por estado (tablero)
CREATE INDEX IF NOT EXISTS ix_tc_llave   ON tarifas.tarifas_cliente (aduana, tipo_operacion, modalidad, cliente_rfc);
CREATE INDEX IF NOT EXISTS ix_tc_estado  ON tarifas.tarifas_cliente (estado);
CREATE INDEX IF NOT EXISTS ix_tc_rfc     ON tarifas.tarifas_cliente (cliente_rfc);

-- Evita duplicar una tarifa activa para el mismo cliente + 3 variables
CREATE UNIQUE INDEX IF NOT EXISTS uq_tc_llave_activa
  ON tarifas.tarifas_cliente (aduana, tipo_operacion, modalidad, cliente_rfc)
  WHERE estado <> 'archivada';

-- ----------------------------------------------------------------------------
-- Historial del ciclo de vida (trazabilidad del tablero / expediente)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tarifas.tarifa_cliente_historial (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarifa_cliente_id   UUID NOT NULL REFERENCES tarifas.tarifas_cliente(id) ON DELETE CASCADE,
  estado              TEXT NOT NULL,
  nota                TEXT,
  actor               TEXT,        -- usuario Keycloak (sub / preferred_username) que ejecutó la acción
  fecha               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_hist_tc ON tarifas.tarifa_cliente_historial (tarifa_cliente_id, fecha);

-- ----------------------------------------------------------------------------
-- Trigger simple para updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION tarifas.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tg_touch ON tarifas.tarifas_generales;
CREATE TRIGGER trg_tg_touch BEFORE UPDATE ON tarifas.tarifas_generales
  FOR EACH ROW EXECUTE FUNCTION tarifas.touch_updated_at();

DROP TRIGGER IF EXISTS trg_tc_touch ON tarifas.tarifas_cliente;
CREATE TRIGGER trg_tc_touch BEFORE UPDATE ON tarifas.tarifas_cliente
  FOR EACH ROW EXECUTE FUNCTION tarifas.touch_updated_at();
