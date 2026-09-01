# GT · Gestor de Tarifas — Frontend

`index.html` **es el artefacto compilado** del Gestor de Tarifas: contiene los
mismos estilos, componentes y reglas que la versión HTML entregada (React, CSS y
lógica embebidos, sin dependencias externas salvo la fuente Poppins).

## Correr en desarrollo (lo pedido: `npx vite --host`)
```bash
cp .env.example .env
npm install
npx vite --host      # sirve el artefacto en http://<tu-ip>:5173
```

## Servir en producción (Docker)
El artefacto ya está compilado, así que se sirve estático (sin build):
```bash
docker build -t doxia/gt-frontend .
docker run -p 5173:5173 doxia/gt-frontend
```
El gateway del monolito enruta `/gt → gt-frontend:5173`.

## Capa de integración (src/)
El artefacto hoy funciona 100% en memoria (igual que el HTML original). Para
conectarlo al backend del monolito cuando se disponga del código fuente React:

- `src/auth/keycloak.ts` — login con el realm `doxia` (Keycloak compartido).
- `src/api/client.ts` — fetch con Bearer token automático.
- `src/api/tarifas.ts` — CRUD de tarifas, ciclo de vida y endpoint del Cotizador.

Estas piezas son el "puente" hacia la API: se importan desde el código fuente del
artefacto para sustituir el estado en memoria por llamadas reales. No se usan
mientras se sirve el artefacto compilado tal cual.
