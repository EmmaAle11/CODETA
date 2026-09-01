import Keycloak from 'keycloak-js';

// Cliente Keycloak del frontend. Usa el MISMO realm del monolito Doxia,
// para que GT sea "una conexión más" bajo el Auth central.
export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'doxia',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'gt-frontend',
});

let inicializado = false;

/** Inicializa Keycloak y exige login. Devuelve true si hay sesión válida. */
export async function initAuth(): Promise<boolean> {
  if (inicializado) return keycloak.authenticated ?? false;
  inicializado = true;
  const ok = await keycloak.init({
    onLoad: 'login-required',
    pkceMethod: 'S256',
    checkLoginIframe: false,
  });
  // Refresca el token de forma proactiva
  setInterval(() => keycloak.updateToken(60).catch(() => keycloak.login()), 30000);
  return ok;
}

export const getToken = () => keycloak.token;
export const logout = () => keycloak.logout();
