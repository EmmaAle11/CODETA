# GT · Backend (Node.js + Express)

API del módulo. Valida JWT de Keycloak y expone tarifas + ciclo de vida + el
endpoint de integración con el Cotizador.

## Endpoints
| Método | Ruta | Descripción |
|---|---|---|
| GET  | `/api/health` | Healthcheck (sin auth) |
| GET/POST/DELETE | `/api/tarifas-generales` | CRUD de tarifas generales |
| GET/POST/PUT | `/api/tarifas-cliente` | Tarifas por cliente |
| PATCH | `/api/tarifas-cliente/:id/estado` | Avanzar el ciclo de vida |
| GET | `/api/cotizador/resolver` | Integración con QuoteForm.tsx |

Todas (excepto health) requieren `Authorization: Bearer <token Keycloak>` y el
rol `gt-user`.

## Correr
```bash
cp .env.example .env
npm install
npm run migrate   # aplica db/migrations
npm run dev
```
