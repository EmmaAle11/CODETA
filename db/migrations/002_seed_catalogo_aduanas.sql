-- ============================================================================
-- GT · Migración 002 — Seed del catálogo de aduanas
--
-- Solo se cargan los puntos de despacho. NO se cargan tarifas ficticias:
-- las tarifas generales las captura el usuario desde la UI (el artefacto se
-- entregó sin registros de demostración).
--
-- Alcance con tarifa oficial (según cotizador-contexto): Veracruz, Manzanillo,
-- Lázaro Cárdenas, AICM, AIFA. Los demás quedan como catálogo pendiente.
-- ============================================================================

INSERT INTO tarifas.aduanas (nombre, tipo, subgrupo, activo) VALUES
  ('Veracruz',                                        'maritima',   'puertos',  TRUE),
  ('Manzanillo',                                      'maritima',   'puertos',  TRUE),
  ('Lázaro Cárdenas',                                 'maritima',   'puertos',  TRUE),
  ('Altamira',                                        'maritima',   'puertos',  TRUE),
  ('Aeropuerto Internacional de la CDMX (AICM)',      'aerea',      'aeropuertos', TRUE),
  ('Aeropuerto Internacional Felipe Ángeles (AIFA)',  'aerea',      'aeropuertos', TRUE),
  ('Pantaco',                                         'multimodal', NULL,       TRUE),
  ('Cancún',                                          'aerea',      'aeropuertos', TRUE),
  ('Puerto Morelos',                                  'maritima',   'puertos',  TRUE),
  ('Puerto Progreso',                                 'maritima',   'puertos',  TRUE),
  ('Monterrey',                                       'aerea',      'aeropuertos', TRUE),
  ('Colombia',                                        'fronteriza', NULL,       TRUE),
  ('Nuevo Laredo',                                    'fronteriza', NULL,       TRUE)
ON CONFLICT (nombre) DO NOTHING;
