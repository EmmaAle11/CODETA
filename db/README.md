# Base de datos — GT

Esquema `tarifas` dentro del PostgreSQL compartido del monolito.

## Migraciones
- `001_schema.sql` — tablas del módulo (generales, cliente, historial, aduanas).
- `002_seed_catalogo_aduanas.sql` — solo catálogo de aduanas (sin tarifas ficticias).

## Aplicar
Standalone (Docker): se aplican solas al iniciar Postgres
(`/docker-entrypoint-initdb.d`).

Manual / dentro del monolito:
```bash
psql "$DATABASE_URL" -f db/migrations/001_schema.sql
psql "$DATABASE_URL" -f db/migrations/002_seed_catalogo_aduanas.sql
# o, desde el backend:
cd backend && npm run migrate
```
