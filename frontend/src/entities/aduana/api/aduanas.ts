import { api } from '../../../shared/api/client';
import type { Aduana } from '../model/types';

export const AduanasAPI = {
  listar: () => api<Aduana[]>('/aduanas'),
};
