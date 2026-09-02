# GT · Gestor de Tarifas — Frontend

Aplicación real (Vite + React + TypeScript) **conectada al backend de GT**.
Estructura Feature-Sliced Design:

```
src/app/        arranque, proveedor de sesión, App
src/pages/      Inicio · Tarifas Generales · Tarifas por Cliente
src/widgets/    tablas (generales, cliente)
src/features/   crear-tarifa-general · crear-tarifa-cliente · avanzar-estado · emitir-tarifa
src/entities/   tarifa (tipos, ciclo de vida, API) · aduana (tipos, API)
src/shared/     cliente HTTP, auth, config, primitivos de UI (sin librería externa)
```

## Desarrollo

```bash
cp .env.example .env
npm install
npm run dev          # http://localhost:5173, con proxy /api -> localhost:4010
npm run typecheck    # tsc --noEmit
npm run build        # genera dist/
```

Sin un Keycloak a mano, `VITE_AUTH=off` en `.env` salta el login (solo pruebas).

## Producción: un solo puerto

El backend sirve `dist/` desde su mismo proceso cuando se define
`GT_FRONTEND_DIST`. Eso deja la app y la API en el mismo origen —sin CORS— y es
lo que permite exponer GT por un túnel con una sola URL:

```bash
cd frontend && npm run build
cd ../backend && GT_FRONTEND_DIST=../frontend/dist npm start
```

| Ruta   | Sirve                                                     |
|--------|-----------------------------------------------------------|
| `/`    | la app conectada al backend (antes servía el artefacto)   |
| `/app` | lo mismo (fallback SPA)                                    |
| `/demo`| `public/gt-artefacto.html`, el bundle en memoria anterior  |
| `/api` | la API                                                     |

El backend inyecta `window.__GT__` en el shell en tiempo de ejecución, así que
**una misma imagen** sirve con Keycloak (monolito) y con la auth apagada
(pruebas), sin recompilar el bundle.

La imagen Docker de este directorio se conserva para el despliegue de dos
servicios del monolito (gateway `/gt` → `:5173`); hace el build y sirve `dist/`.

## El artefacto anterior

`public/gt-artefacto.html` es el bundle compilado que ocupaba la raíz y corría
100% en memoria del navegador (0 llamadas `fetch`). Se conserva intacto como
referencia y se sirve en `/demo`; ya no es la pantalla principal.
