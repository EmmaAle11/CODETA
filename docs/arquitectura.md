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

Con `GT_AUTH=off` el backend deja pasar todo con un usuario anónimo y el
frontend no llama a Keycloak. Es **solo para pruebas** (túnel / Render, donde no
hay realm alcanzable); el backend lo inyecta en el shell como `window.__GT__`
para que las dos capas queden simétricas sin recompilar el bundle.

## Persistencia (PostgreSQL)
- Esquema propio `tarifas` (patrón `esquema.tabla`, igual que `comercial.quotes`).
- Tablas: `tarifas_generales`, `tarifas_cliente`, `tarifa_cliente_historial`,
  `aduanas` (catálogo de solo lectura, expuesto en `GET /aduanas`).
- Las tarifas de cliente **copian** los montos de la tarifa general al crearse:
  `tarifas_cliente` tiene columnas propias y ninguna consulta vuelve a leer
  `tarifas_generales`. Editar una tarifa general (`PATCH /tarifas-generales/:id`)
  no altera las tarifas de cliente ya creadas — una tarifa emitida y firmada no
  puede mutar retroactivamente. `tarifa_general_id` es solo trazabilidad.
- El ciclo de vida (captura → generada → emitida → enviada → validacion →
  archivada) se controla en el repositorio con transiciones válidas y se registra
  en `tarifa_cliente_historial` (trazabilidad del tablero/expediente).

## Cómo se sirve el frontend

Dos modos, con el mismo build:

1. **Un solo servicio** (pruebas, túnel, Render). Con `GT_FRONTEND_DIST`, el
   backend sirve `frontend/dist/` desde su propio proceso: `/` es la app, `/api`
   la API, `/demo` el artefacto anterior. Mismo origen, sin CORS, una sola URL.
2. **Dos servicios** (monolito). El gateway enruta:

   | Ruta pública    | Destino interno      |
   |-----------------|----------------------|
   | `/gt`           | `gt-frontend:5173`   |
   | `/api/gt/*`     | `gt-backend:4010`    |

El backend respeta `GT_BASE_PATH` para montar bajo `/api` (standalone) o
`/api/gt` (detrás del gateway).

## Base de datos en plataformas gestionadas
`DATABASE_URL` gana sobre las `PG*` cuando existe (es lo único que entrega
Render). El TLS se decide por `PGSSLMODE` o, si no viene, por la red: una
dirección privada o un nombre sin punto se trata como red interna y va sin TLS.

## Documentos firmados
Las columnas `doc_agencia_url` / `doc_cliente_url` guardan **referencias** al
storage del monolito (p. ej. S3), no binarios. La verificación OCR y la firma se
capturan como metadatos (`firma`, `verificacion_reporte` en JSONB).

## Qué queda como extensión futura
- Multi-moneda / IVA variable (hoy MXN + IVA estándar).
- Versionado histórico de tarifas por vigencia (hoy la vigencia vive en la
  tarifa por cliente; el versionado de generales se puede añadir con una tabla
  `tarifas_generales_versiones`).
- OCR real (el backend ya expone `verificacion_reporte` para almacenarlo).
- Subida de documentos: no hay backend de archivos en el stack;
  `doc_agencia_url`/`doc_cliente_url` son referencias a storage externo.
- Datos adicionales por etapa: hoy solo «Emitir» captura `extra` (la firma);
  «Enviar» y «Recibir y validar» solo mueven el estado.
- Validación de campos requeridos por etapa en el backend: `avanzarEstado` valida
  que la transición sea legal, no que `emitida` traiga `firma` (hoy lo exige el
  frontend).
