import { config } from '../config/env';
import { getToken } from '../auth/keycloak';

/**
 * Fetch contra la API de GT. Manda `Authorization` SOLO si hay token: con la
 * auth apagada no lo hay, y mandar "Bearer " vacío haría que el backend
 * rechazara peticiones que su propio middleware abierto sí acepta.
 */
export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${config.apiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const detalle = await res.json().catch(() => ({} as { error?: string }));
    throw new Error(detalle.error || `HTTP ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
