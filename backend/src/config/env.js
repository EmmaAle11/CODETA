// Configuración central por variables de entorno.
// En el monolito, estas vienen del .env compartido o del orquestador (Docker/K8s).

export const env = {
  port: parseInt(process.env.GT_PORT || '4010', 10),

  // Base de datos (PostgreSQL compartido del monolito)
  db: {
    host: process.env.PGHOST || 'postgres',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'doxia',
    password: process.env.PGPASSWORD || 'doxia',
    database: process.env.PGDATABASE || 'doxia',
    schema: process.env.GT_DB_SCHEMA || 'tarifas',
  },

  // Keycloak (Auth compartido del monolito)
  keycloak: {
    // URL del realm, ej: http://keycloak:8080/realms/doxia
    issuer: process.env.KEYCLOAK_ISSUER || 'http://keycloak:8080/realms/doxia',
    // Endpoint JWKS para validar la firma de los tokens
    jwksUri:
      process.env.KEYCLOAK_JWKS_URI ||
      'http://keycloak:8080/realms/doxia/protocol/openid-connect/certs',
    // audience esperada (client id del backend), opcional
    audience: process.env.KEYCLOAK_AUDIENCE || 'gt-backend',
    // Rol requerido para operar el módulo (autorización)
    requiredRole: process.env.GT_REQUIRED_ROLE || 'gt-user',
  },

  // Orígenes permitidos para CORS (frontend Vite y el resto del monolito)
  corsOrigins: (process.env.GT_CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim()),
};
