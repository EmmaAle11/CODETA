import React, { useEffect, useState } from 'react';
import { config } from '../../shared/config/env';
import { initAuth } from '../../shared/auth/keycloak';

type Estado = { fase: 'cargando' } | { fase: 'listo' } | { fase: 'error'; error: unknown };

/**
 * Arranque de sesión, simétrico al middleware de auth del backend.
 *
 * Con la auth apagada (GT_AUTH=off inyectado por el backend, o VITE_AUTH=off en
 * `npm run dev`) NO se llama a Keycloak y la app monta directo: es lo que
 * permite exponer GT en un túnel o en Render sin un realm detrás. Por defecto
 * exige login, igual que dentro del monolito.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>(
    config.authOff ? { fase: 'listo' } : { fase: 'cargando' }
  );

  useEffect(() => {
    if (config.authOff) {
      console.warn('[GT] autenticación desactivada: solo para pruebas.');
      return;
    }
    let vivo = true;
    initAuth()
      .then(() => vivo && setEstado({ fase: 'listo' }))
      .catch((error) => vivo && setEstado({ fase: 'error', error }));
    return () => { vivo = false; };
  }, []);

  if (estado.fase === 'cargando') return <Mensaje titulo="Iniciando sesión…" />;
  if (estado.fase === 'error') {
    return (
      <Mensaje titulo="No se pudo iniciar sesión">
        <p>Verifica la configuración de Keycloak (realm / clientId / URL).</p>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{String(estado.error)}</pre>
      </Mensaje>
    );
  }
  return <>{children}</>;
}

function Mensaje({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 640, margin: '48px auto' }}>
      <h3>{titulo}</h3>
      {children}
    </div>
  );
}
