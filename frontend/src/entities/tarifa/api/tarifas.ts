import { api } from '../../../shared/api/client';
import type { TarifaCliente, TarifaGeneral, TarifaResuelta, EstadoTarifa } from '../model/types';

// Capa de acceso a la API de GT. Es el puente que ya existía en src/api/;
// se movió aquí para que viva en su entidad (FSD) y se le añadieron los tipos.
// La forma de cada llamada no cambió.

export const TarifasAPI = {
  // Tarifas generales
  listarGenerales: (q: Record<string, string> = {}) =>
    api<TarifaGeneral[]>(`/tarifas-generales?${new URLSearchParams(q)}`),
  crearGeneral: (tg: Partial<TarifaGeneral>) =>
    api<TarifaGeneral>('/tarifas-generales', { method: 'POST', body: JSON.stringify(tg) }),
  // Edita los montos; la llave (aduana/operación/modalidad) no se toca.
  editarGeneral: (id: string, tg: Partial<TarifaGeneral>) =>
    api<TarifaGeneral>(`/tarifas-generales/${id}`, { method: 'PATCH', body: JSON.stringify(tg) }),
  eliminarGeneral: (id: string) =>
    api<void>(`/tarifas-generales/${id}`, { method: 'DELETE' }),

  // Tarifas por cliente
  listarCliente: (q: Record<string, string> = {}) =>
    api<TarifaCliente[]>(`/tarifas-cliente?${new URLSearchParams(q)}`),
  obtenerCliente: (id: string) => api<TarifaCliente>(`/tarifas-cliente/${id}`),
  crearCliente: (tp: Partial<TarifaCliente>) =>
    api<TarifaCliente>('/tarifas-cliente', { method: 'POST', body: JSON.stringify(tp) }),
  editarCliente: (id: string, tp: Partial<TarifaCliente>) =>
    api<TarifaCliente>(`/tarifas-cliente/${id}`, { method: 'PUT', body: JSON.stringify(tp) }),

  // Ciclo de vida: captura → generada → emitida → enviada → validacion → archivada
  avanzarEstado: (id: string, estado: EstadoTarifa, nota?: string, extra?: unknown) =>
    api<TarifaCliente>(`/tarifas-cliente/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado, nota, extra }),
    }),

  // Integración Cotizador (lo consume QuoteForm.tsx del monolito)
  resolverCotizador: (p: { aduana: string; tipoOperacion: string; modalidadEnvio?: string; tipoMercancia?: string }) =>
    api<TarifaResuelta>(`/cotizador/resolver?${new URLSearchParams(p as Record<string, string>)}`),
};
