import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../config/env.js';

const AUTH_APAGADA = env.auth === 'off';

// Conjunto de llaves públicas de Keycloak (se cachea y rota solo). Se crea de
// forma perezosa: con GT_AUTH=off no hay realm que consultar, y construirlo
// obligaría a tener una KEYCLOAK_JWKS_URI válida para arrancar sin ella.
let jwks = null;
const getJWKS = () => (jwks ??= createRemoteJWKSet(new URL(env.keycloak.jwksUri)));

if (AUTH_APAGADA) {
  console.warn('[GT] AUTENTICACIÓN DESACTIVADA (GT_AUTH=off): solo para pruebas.');
}

/**
 * Middleware que valida el Bearer token emitido por Keycloak.
 * - Verifica firma (JWKS), issuer y (opcional) audience.
 * - Adjunta req.user con { sub, username, roles }.
 *
 * El monolito ya autentica con Keycloak; este módulo solo CONSUME ese token,
 * no crea sesiones propias. Así GT es "una conexión más" bajo el mismo Auth.
 *
 * Con GT_AUTH=off deja pasar todo con un usuario anónimo. Es lo que permite
 * exponer GT en un túnel o en Render sin un realm detrás; NUNCA en el monolito.
 */
export async function requireAuth(req, res, next) {
  if (AUTH_APAGADA) {
    req.user = { sub: 'anonimo', username: 'anonimo', roles: [env.keycloak.requiredRole] };
    return next();
  }

  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Token ausente' });
    }

    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer: env.keycloak.issuer,
      // audience: env.keycloak.audience, // habilitar si el realm emite aud fija
    });

    const realmRoles = payload.realm_access?.roles || [];
    const clientRoles = Object.values(payload.resource_access || {})
      .flatMap((r) => r.roles || []);

    req.user = {
      sub: payload.sub,
      username: payload.preferred_username || payload.sub,
      roles: [...new Set([...realmRoles, ...clientRoles])],
      raw: payload,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido', detalle: err.message });
  }
}

/** Autorización por rol de Keycloak. */
export function requireRole(role = env.keycloak.requiredRole) {
  return (req, res, next) => {
    if (!req.user?.roles?.includes(role)) {
      return res.status(403).json({ error: `Falta el rol requerido: ${role}` });
    }
    next();
  };
}
