import { query } from '../config/db.js';

// Catálogo de puntos de despacho. Es de solo lectura: lo carga la migración
// 002_seed_catalogo_aduanas.sql, no la aplicación.
export const aduanasRepo = {
  async listar() {
    const { rows } = await query(
      'SELECT id, nombre, tipo, subgrupo FROM aduanas WHERE activo = TRUE ORDER BY tipo, nombre'
    );
    return rows;
  },
};
