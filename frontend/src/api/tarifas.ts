import { api } from './client';

// Capa de acceso a la API de GT. El componente del artefacto (App.tsx)
// debe consumir estas funciones en lugar del estado en memoria cuando se
// integre al backend real. Hoy el artefacto funciona 100% en memoria; esta
// capa es el "puente" para migrarlo endpoint por endpoint.

export const TarifasAPI = {
  // Tarifas generales
  listarGenerales: (q: Record<string, string> = {}) =>
    api(`/tarifas-generales?${new URLSearchParams(q)}`),
  crearGeneral: (tg: unknown) =>
    api('/tarifas-generales', { method: 'POST', body: JSON.stringify(tg) }),
  eliminarGeneral: (id: string) =>
    api(`/tarifas-generales/${id}`, { method: 'DELETE' }),

  // Tarifas por cliente
  listarCliente: (q: Record<string, string> = {}) =>
    api(`/tarifas-cliente?${new URLSearchParams(q)}`),
  obtenerCliente: (id: string) => api(`/tarifas-cliente/${id}`),
  crearCliente: (tp: unknown) =>
    api('/tarifas-cliente', { method: 'POST', body: JSON.stringify(tp) }),
  editarCliente: (id: string, tp: unknown) =>
    api(`/tarifas-cliente/${id}`, { method: 'PUT', body: JSON.stringify(tp) }),

  // Ciclo de vida: generada → emitida → enviada → validacion → archivada
  avanzarEstado: (id: string, estado: string, nota?: string, extra?: unknown) =>
    api(`/tarifas-cliente/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado, nota, extra }),
    }),

  // Integración Cotizador (lo consume QuoteForm.tsx del monolito)
  resolverCotizador: (p: { aduana: string; tipoOperacion: string; modalidadEnvio?: string; tipoMercancia?: string }) =>
    api(`/cotizador/resolver?${new URLSearchParams(p as Record<string, string>)}`),
};
