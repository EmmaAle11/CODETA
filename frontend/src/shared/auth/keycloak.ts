import Keycloak from 'keycloak-js';
import { config } from '../config/env';

// Cliente Keycloak del frontend. Usa el MISMO realm del monolito Doxia,
// para que GT sea "una conexión más" bajo el Auth central.
export const keycloak = new Keycloak({
  url: config.keycloak.url,
  realm: config.keycloak.realm,
  clientId: config.keycloak.clientId,
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

// Con la auth apagada no hay cliente inicializado y `keycloak.token` es
// undefined: el cliente HTTP se apoya en eso para no mandar un Bearer vacío.
export const getToken = () => (config.authOff ? undefined : keycloak.token);
export const logout = () => keycloak.logout();
