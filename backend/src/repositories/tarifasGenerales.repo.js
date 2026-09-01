import { query } from '../config/db.js';

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
  },

  async eliminar(id) {
    await query('UPDATE tarifas_generales SET activo = FALSE WHERE id = $1', [id]);
  },
};
