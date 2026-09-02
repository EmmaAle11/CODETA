// Espejo del CHECK de tarifas.aduanas.tipo (001_schema.sql).
export type TipoAduana = 'maritima' | 'aerea' | 'fronteriza' | 'multimodal';

export interface Aduana {
  id: string;
  nombre: string;
  tipo: TipoAduana;
  subgrupo: string | null;
}
