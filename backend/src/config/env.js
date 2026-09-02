// Configuración central por variables de entorno.
// En el monolito, estas vienen del .env compartido o del orquestador (Docker/K8s).

export const env = {
  // Render/Railway inyectan PORT y esperan que el proceso escuche ahí.
  // GT_PORT se conserva para el compose del monolito.
  port: parseInt(process.env.PORT || process.env.GT_PORT || '4010', 10),

  // 'keycloak' (POR DEFECTO) | 'off'. Con 'off' el backend no valida token ni
  // rol: es EXCLUSIVAMENTE para las pruebas en tunel / Render, donde no hay un
  // Keycloak alcanzable. El frontend lee el mismo valor (se lo inyecta el shell)
  // para no quedarse redirigiendo a un host que no existe.
  auth: process.env.GT_AUTH === 'off' ? 'off' : 'keycloak',

  // Directorio del build del frontend que sirve este mismo proceso. Sin esto,
  // el backend arranca solo como API (comportamiento anterior).
  frontendDist: process.env.GT_FRONTEND_DIST || null,

  // Base de datos (PostgreSQL compartido del monolito)
  db: {
    // DATABASE_URL gana cuando existe: es lo unico que da Render, y Railway lo
    // inyecta ademas de las PG*.
    url: process.env.DATABASE_URL || null,
    host: process.env.PGHOST || 'postgres',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'doxia',
    password: process.env.PGPASSWORD || 'doxia',
    database: process.env.PGDATABASE || 'doxia',
    schema: process.env.GT_DB_SCHEMA || 'tarifas',
    // 'require' | 'disable' | 'verify-full'... Vacio = se decide por la red.
    sslmode: process.env.PGSSLMODE || null,
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

  // Orígenes permitidos para CORS (frontend Vite y el resto del monolito).
  // Vacío = mismo origen: con el backend sirviendo el build no hace falta CORS.
  corsOrigins: (process.env.GT_CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
