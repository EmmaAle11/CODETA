import { pool, query } from '../config/db.js';
import { errorDeNegocio, conflictoPorUnico } from './errores.js';

// Columnas que una transición puede traer consigo (firma, documentos, OCR).
// Lista blanca: `extra` viene del cuerpo de la petición y se concatena como
// nombre de columna, que no se puede parametrizar. Sin esta lista, cualquier
// usuario autenticado podría inyectar SQL por la clave del objeto.
const COLUMNAS_EXTRA = new Set([
  'firma', 'doc_agencia_url', 'doc_cliente_url', 'verificacion_reporte',
  'vigencia_tipo', 'vigencia_inicio', 'vigencia_fin',
]);

const TRANSICIONES = {
  captura:    ['generada'],
  generada:   ['emitida'],
  emitida:    ['enviada'],
  enviada:    ['validacion'],
  validacion: ['archivada'],
  archivada:  [],
};

// Índice uq_tc_llave_activa: impide dos tarifas no archivadas para el mismo
// cliente y la misma combinación de aduana + operación + modalidad.
const UNICO_TARIFA_ACTIVA = 'uq_tc_llave_activa';

export const tarifasClienteRepo = {
  async listar({ estado, rfc, aduana, operacion, modalidad, nivel, enProceso } = {}) {
    const cond = ['1=1'];
    const params = [];
    if (estado)    { params.push(estado);    cond.push(`estado = $${params.length}`); }
    if (enProceso) { cond.push(`estado <> 'archivada'`); }
    if (rfc)       { params.push(`%${rfc}%`); cond.push(`cliente_rfc ILIKE $${params.length}`); }
    if (aduana)    { params.push(aduana);    cond.push(`aduana = $${params.length}`); }
    if (operacion) { params.push(operacion); cond.push(`tipo_operacion = $${params.length}`); }
    if (modalidad) { params.push(modalidad); cond.push(`modalidad = $${params.length}`); }
    if (nivel)     { params.push(nivel);     cond.push(`partner_nivel = $${params.length}`); }
    const { rows } = await query(
      `SELECT * FROM tarifas_cliente WHERE ${cond.join(' AND ')} ORDER BY cliente_razon_social`,
      params
    );
    return rows;
  },

  async obtener(id) {
    const { rows } = await query('SELECT * FROM tarifas_cliente WHERE id = $1', [id]);
    if (!rows[0]) return null;
    const { rows: hist } = await query(
      'SELECT estado, nota, actor, fecha FROM tarifa_cliente_historial WHERE tarifa_cliente_id = $1 ORDER BY fecha',
      [id]
    );
    return { ...rows[0], historial: hist };
  },

  async crear(t, actor) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO tarifas_cliente
          (tarifa_general_id, aduana, tipo_operacion, modalidad,
           cliente_rfc, cliente_razon_social, partner_activo, partner_nivel, partner_datos,
           honorarios_modo, honorarios_rate, honorarios_minimo, honorarios_flat, honorarios_base,
           servicios_modo, servicios_conceptos, servicios_flat, servicios_base, cargos_adicionales,
           vigencia_tipo, vigencia_inicio, vigencia_fin, estado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
         RETURNING *`,
        [
          t.tarifa_general_id ?? null, t.aduana, t.tipo_operacion, t.modalidad,
          t.cliente_rfc, t.cliente_razon_social, t.partner_activo ?? false,
          t.partner_nivel ?? 'directo', JSON.stringify(t.partner_datos ?? {}),
          t.honorarios_modo, t.honorarios_rate, t.honorarios_minimo, t.honorarios_flat, t.honorarios_base,
          t.servicios_modo, JSON.stringify(t.servicios_conceptos ?? []), t.servicios_flat, t.servicios_base,
          JSON.stringify(t.cargos_adicionales ?? []),
          t.vigencia_tipo ?? null, t.vigencia_inicio ?? null, t.vigencia_fin ?? null,
          t.estado ?? 'captura',
        ]
      );
      await client.query(
        `INSERT INTO tarifa_cliente_historial (tarifa_cliente_id, estado, nota, actor)
         VALUES ($1,$2,$3,$4)`,
        [rows[0].id, rows[0].estado, 'Tarifa creada', actor]
      );
      await client.query('COMMIT');
      return rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      // Sin esto la violación del índice único sale como un 500 "Error interno"
      // que no le dice nada a quien está capturando la tarifa.
      const conflicto = conflictoPorUnico(e, UNICO_TARIFA_ACTIVA,
        'Ya existe una tarifa en proceso para este cliente en esta aduana/operación/modalidad.');
      throw conflicto ?? e;
    } finally {
      client.release();
    }
  },

  async actualizarDatos(id, t) {
    const { rows } = await query(
      `UPDATE tarifas_cliente SET
         honorarios_modo=$2, honorarios_rate=$3, honorarios_minimo=$4, honorarios_flat=$5, honorarios_base=$6,
         servicios_modo=$7, servicios_conceptos=$8, servicios_flat=$9, servicios_base=$10,
         cargos_adicionales=$11, vigencia_tipo=$12, vigencia_inicio=$13, vigencia_fin=$14,
         partner_activo=$15, partner_nivel=$16, partner_datos=$17
       WHERE id=$1 RETURNING *`,
      [
        id, t.honorarios_modo, t.honorarios_rate, t.honorarios_minimo, t.honorarios_flat, t.honorarios_base,
        t.servicios_modo, JSON.stringify(t.servicios_conceptos ?? []), t.servicios_flat, t.servicios_base,
        JSON.stringify(t.cargos_adicionales ?? []),
        t.vigencia_tipo ?? null, t.vigencia_inicio ?? null, t.vigencia_fin ?? null,
        t.partner_activo ?? false, t.partner_nivel ?? 'directo', JSON.stringify(t.partner_datos ?? {}),
      ]
    );
    return rows[0];
  },

  // Transición de estado del ciclo de vida (valida que sea legal)
  async avanzarEstado(id, nuevoEstado, { nota, actor, extra = {} } = {}) {
    const actual = await this.obtener(id);
    if (!actual) return null;
    const permitidos = TRANSICIONES[actual.estado] || [];
    if (!permitidos.includes(nuevoEstado)) {
      throw errorDeNegocio(409, `Transición no permitida: ${actual.estado} → ${nuevoEstado}`);
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Campos extra opcionales que acompañan la transición (firma, docs, verificación)
      const sets = ['estado = $2'];
      const params = [id, nuevoEstado];
      for (const [col, val] of Object.entries(extra || {})) {
        if (!COLUMNAS_EXTRA.has(col)) continue;
        // null es 'object' en JS: pasarlo por JSON.stringify guardaría la
        // cadena "null" en vez de un NULL de verdad.
        params.push(val !== null && typeof val === 'object' ? JSON.stringify(val) : val);
        sets.push(`${col} = $${params.length}`);
      }
      const { rows } = await client.query(
        `UPDATE tarifas_cliente SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
        params
      );
      await client.query(
        `INSERT INTO tarifa_cliente_historial (tarifa_cliente_id, estado, nota, actor)
         VALUES ($1,$2,$3,$4)`,
        [id, nuevoEstado, nota ?? null, actor ?? null]
      );
      await client.query('COMMIT');
      return rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
};
