# Arquitectura de GT dentro del monolito

## Principio
GT es un **módulo desacoplado** (backend + frontend propios) que se apoya en
los servicios compartidos del monolito (PostgreSQL y Keycloak). No duplica Auth
ni base de datos: **consume** los del sistema.

## Flujo de autenticación (Keycloak)
1. El usuario entra a `/gt` (frontend). `keycloak-js` exige login contra el
   realm `doxia` (el mismo del monolito).
2. El frontend obtiene un JWT y lo envía en `Authorization: Bearer` a
   `/api/gt/*`.
3. El backend valida el JWT con el **JWKS** de Keycloak (firma + issuer) y exige
   el rol `gt-user`. No crea sesiones propias.

## Persistencia (PostgreSQL)
- Esquema propio `tarifas` (patrón `esquema.tabla`, igual que `comercial.quotes`).
- Tablas: `tarifas_generales`, `tarifas_cliente`, `tarifa_cliente_historial`,
  `aduanas`.
- El ciclo de vida (captura → generada → emitida → enviada → validacion →
  archivada) se controla en el repositorio con transiciones válidas y se registra
  en `tarifa_cliente_historial` (trazabilidad del tablero/expediente).

## Enrutamiento en el gateway del monolito
| Ruta pública        | Destino interno         |
|---------------------|-------------------------|
| `/gt`           | `gt-frontend:5173`  |
| `/api/gt/*`     | `gt-backend:4010`   |

El backend respeta `GT_BASE_PATH` para montar bajo `/api` (standalone) o
`/api/gt` (detrás del gateway).

## Documentos firmados
Las columnas `doc_agencia_url` / `doc_cliente_url` guardan **referencias** al
storage del monolito (p. ej. S3), no binarios. La verificación OCR y la firma se
capturan como metadatos (`firma`, `verificacion_reporte` en JSONB).

## Qué queda como extensión futura
- Multi-moneda / IVA variable (hoy MXN + IVA estándar).
- Versionado histórico de tarifas por vigencia (hoy la vigencia vive en la
  tarifa por cliente; el versionado de generales se puede añadir con una tabla
  `tarifas_generales_versiones`).
- OCR real (hoy la verificación es asistida/simulada en el artefacto; el backend
  ya expone el campo para almacenar el reporte real cuando se conecte un motor).
