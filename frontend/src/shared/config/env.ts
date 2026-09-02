// Único punto que lee la configuración. El resto del frontend recibe estos valores.
//
// El backend inyecta `window.__GT__` al servir el shell, y eso GANA sobre lo que
// se compiló: así una sola imagen sirve para las pruebas (auth apagada) y para
// el monolito (Keycloak) sin recompilar el bundle.
declare global {
  interface Window { __GT__?: { auth?: string } }
}

const runtime = typeof window !== 'undefined' ? window.__GT__ ?? {} : {};

export const config = {
  apiBase: import.meta.env.VITE_API_BASE || '/api',

  // 'keycloak' (POR DEFECTO) | 'off' — simétrico a GT_AUTH del backend, que es
  // quien lo inyecta. VITE_AUTH solo hace falta con `npm run dev`, donde el
  // shell lo sirve Vite y no el backend.
  // 'off' es solo para las pruebas en túnel / Render, donde no hay un Keycloak
  // alcanzable: sin esto la app se queda redirigiendo a un host inexistente y
  // no pinta nada.
  authOff: (runtime.auth ?? import.meta.env.VITE_AUTH) === 'off',

  keycloak: {
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'doxia',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'gt-frontend',
  },
} as const;
