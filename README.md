# GT · Gestor de Tarifas (Constructor de Tarifas Aduanales)

Módulo del monolito **SIPCA / Plataforma DoxIA** para construir, personalizar y
dar seguimiento (ciclo de vida) a las tarifas de despacho aduanal, y para
alimentar al **Cotizador** con tarifas reales en lugar de valores quemados en
código.

GT está diseñado como **"una conexión más"** dentro del sistema que gobierna
los microservidores: consume el **PostgreSQL** y el **Keycloak** compartidos del
monolito, expone su propia API Node.js y su frontend Vite.

## Arquitectura en una vista

```
                    ┌─────────────────────────── Monolito SIPCA / DoxIA ───────────────────────────┐
                    │                                                                               │
   Navegador ──▶ Gateway ──▶ /gt  ──────────────▶  gt-frontend  (Vite + React)             │
                    │         /api/gt ───────────▶  gt-backend   (Node.js + Express)        │
                    │                                          │                                     │
                    │            Keycloak (Auth) ◀─────────────┤ valida JWT (JWKS)                   │
                    │            PostgreSQL       ◀────────────┘ esquema `tarifas`                   │
                    │                                                                               │
                    │   Cotizador (QuoteForm.tsx) ──▶ GET /api/gt/cotizador/resolver ──▶ backend │
                    └───────────────────────────────────────────────────────────────────────────────┘
```

Las **4 dimensiones** que definen una tarifa (aduana · operación · modalidad ·
mercancía) son las mismas que ya usa `comercial.quotes`, y el **RFC** del cliente
es la 4ª variable que hace única a cada *tarifa por cliente*.

## Piezas clave

| Pieza                    | Tecnología                     | Carpeta        |
|--------------------------|--------------------------------|----------------|
| Base de datos            | PostgreSQL (esquema `tarifas`) | `db/`          |
| Auth                     | Keycloak (JWT / JWKS)          | (compartido)   |
| Backend / API            | Node.js + Express              | `backend/`     |
| Frontend                 | Vite + React (`npx vite --host`) | `frontend/`  |
| Orquestación             | Docker Compose                 | raíz           |

## Estructura de carpetas

```
gt/
├── README.md
├── docker-compose.gt.yml        # fragmento para EMBEBER en el monolito
├── docker-compose.standalone.yml    # stack completo para dev aislado
├── db/
│   ├── migrations/
│   │   ├── 001_schema.sql            # esquema `tarifas` (generales, cliente, historial)
│   │   └── 002_seed_catalogo_aduanas.sql
│   └── README.md
├── backend/                         # API Node.js
│   ├── Dockerfile · package.json · .env.example
│   └── src/
│       ├── server.js
│       ├── config/       (env, db)
│       ├── middleware/   (auth Keycloak, errores)
│       ├── routes/       (tarifas-generales, tarifas-cliente, cotizador)
│       ├── services/     (integración cotizador)
│       ├── repositories/ (acceso a datos)
│       └── scripts/migrate.js
├── frontend/                        # Vite (sirve el artefacto compilado)
│   ├── index.html                   # EL ARTEFACTO GT (mismos estilos/componentes/reglas)
│   ├── Dockerfile · package.json · vite.config.ts · .env.example
│   └── src/                         # capa de integración (no altera el artefacto)
│       ├── auth/keycloak.ts
│       └── api/ (client.ts, tarifas.ts)
└── docs/
    ├── arquitectura.md
    └── integracion-cotizador.md
```

## Cómo correrlo

### Opción A — Embebido en el monolito (producción)
Postgres y Keycloak ya existen en el monolito. Desde la raíz del monolito:
```bash
cp gt/backend/.env.example  gt/backend/.env
cp gt/frontend/.env.example gt/frontend/.env
docker compose -f docker-compose.yml -f gt/docker-compose.gt.yml up -d
```
Enruta en el gateway: `/gt → gt-frontend:5173` y `/api/gt → gt-backend:4010`.

### Opción B — Standalone (desarrollo)
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose -f docker-compose.standalone.yml up -d
# Backend  : http://localhost:4010/api/health
# Frontend : http://localhost:5173
```

### Frontend en modo dev (sin Docker)
```bash
cd frontend
npm install
npx vite --host
```

## Estado de integración

`frontend/index.html` **es el artefacto GT compilado**: los mismos estilos,
componentes y reglas de la versión HTML que ves en pantalla. `npx vite --host` lo
sirve tal cual; en Docker se sirve estático. Hoy funciona 100% en memoria (igual
que el HTML original, sin backend).

El **backend Node.js**, la **base de datos PostgreSQL**, el **Auth Keycloak** y el
**andamiaje de API** (`frontend/src/`) son la "conexión" hacia el monolito: quedan
listos para que, cuando se disponga del código fuente React del artefacto, se
sustituya el estado en memoria por llamadas reales endpoint por endpoint. Ver
`frontend/README.md` y `docs/integracion-cotizador.md`.