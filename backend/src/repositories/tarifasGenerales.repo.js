import { query } from '../config/db.js';
import { conflictoPorUnico } from './errores.js';

// CONSTRAINT uq_tg_llave: una sola tarifa general por combinación de aduana +
// tipo_operacion + modalidad (001_schema.sql).
const UNICA_LLAVE_GENERAL = 'uq_tg_llave';

export const tarifasGeneralesRepo = {
  async listar({ aduana, operacion, modalidad } = {}) {
    const cond = ['activo = TRUE'];
    const params = [];
    if (aduana)    { params.push(aduana);    cond.push(`aduana = $${params.length}`); }
    if (operacion) { params.push(operacion); cond.push(`tipo_operacion = $${params.length}`); }
    if (modalidad) { params.push(modalidad); cond.push(`modalidad = $${params.length}`); }
    const { rows } = await query(
      `SELECT * FROM tarifas_generales WHERE ${cond.join(' AND ')} ORDER BY aduana`,
      params
    );
    return rows;
  },

  async obtener(id) {
    const { rows } = await query('SELECT * FROM tarifas_generales WHERE id = $1', [id]);
    return rows[0] || null;
  },

  // Resuelve la tarifa general por la llave de negocio (aduana+operación+modalidad)
  async porLlave({ aduana, operacion, modalidad }) {
    const { rows } = await query(
      `SELECT * FROM tarifas_generales
        WHERE aduana = $1 AND tipo_operacion = $2 AND modalidad = $3 AND activo = TRUE
        LIMIT 1`,
      [aduana, operacion, modalidad]
    );
    return rows[0] || null;
  },

  async crear(t) {
    try {
      const { rows } = await query(
        `INSERT INTO tarifas_generales
          (aduana, tipo_operacion, modalidad,
           honorarios_modo, honorarios_rate, honorarios_minimo, honorarios_flat, honorarios_base,
           servicios_modo, servicios_conceptos, servicios_flat, servicios_base,
           cargos_adicionales)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING *`,
        [
          t.aduana, t.tipo_operacion, t.modalidad,
          t.honorarios_modo, t.honorarios_rate, t.honorarios_minimo, t.honorarios_flat, t.honorarios_base,
          t.servicios_modo, JSON.stringify(t.servicios_conceptos ?? []), t.servicios_flat, t.servicios_base,
          JSON.stringify(t.cargos_adicionales ?? []),
        ]
      );
      return rows[0];
    } catch (e) {
      // Sin esto la violación de la restricción única sale como un 500
      // "Error interno" que no le dice nada a quien captura la tarifa.
      const conflicto = conflictoPorUnico(e, UNICA_LLAVE_GENERAL,
        'Ya existe una tarifa general para esta aduana, operación y modalidad.');
      throw conflicto ?? e;
    }
  },

  /**
   * Edita una tarifa general existente. NO toca la llave de negocio
   * (aduana + tipo_operacion + modalidad): cambiarla convertiría la tarifa en
   * otra distinta y chocaría con uq_tg_llave. Para eso se crea una nueva.
   *
   * Las tarifas de cliente ya creadas a partir de esta NO cambian: `crear` de
   * tarifasCliente.repo.js copia los montos a columnas propias de
   * tarifas_cliente, y ninguna consulta de ese repositorio vuelve a leer
   * tarifas_generales. La edición solo afecta a las tarifas de cliente futuras.
   */
  async actualizar(id, t) {
    const { rows } = await query(
      `UPDATE tarifas_generales SET
         honorarios_modo=$2, honorarios_rate=$3, honorarios_minimo=$4,
         honorarios_flat=$5, honorarios_base=$6,
         servicios_modo=$7, servicios_conceptos=$8, servicios_flat=$9, servicios_base=$10,
         cargos_adicionales=$11
       WHERE id=$1 AND activo = TRUE
       RETURNING *`,
      [
        id, t.honorarios_modo, t.honorarios_rate, t.honorarios_minimo,
        t.honorarios_flat, t.honorarios_base,
        t.servicios_modo, JSON.stringify(t.servicios_conceptos ?? []), t.servicios_flat, t.servicios_base,
        JSON.stringify(t.cargos_adicionales ?? []),
      ]
    );
    return rows[0] || null;
  },

  async eliminar(id) {
    await query('UPDATE tarifas_generales SET activo = FALSE WHERE id = $1', [id]);
  },
};
