import pg from 'pg';
import { env } from './env.js';

const schema = aseguraIdentificador(env.db.schema);

const base = {
  max: 10,
  idleTimeoutMillis: 30000,
  // Fija el search_path en el paquete de arranque de CADA conexión nueva.
  // Hacerlo aquí, y no con un `SET` en el evento 'connect', evita la carrera
  // entre ese SET y la primera consulta que tome la conexión del pool.
  options: `-c search_path=${schema},public`,
};

// Pool de conexiones al PostgreSQL compartido del monolito — o al que
// provisionen Render / Railway, que solo entregan DATABASE_URL.
export const pool = new pg.Pool(
  env.db.url
    ? { ...base, connectionString: env.db.url, ssl: sslPara(env.db.url, env.db.sslmode) }
    : {
        ...base,
        host: env.db.host,
        port: env.db.port,
        user: env.db.user,
        password: env.db.password,
        database: env.db.database,
      }
);

pool.on('error', (err) => console.error('[GT] error en el pool de Postgres:', err.message));

export const query = (text, params) => pool.query(text, params);

/**
 * ¿TLS o no?
 *
 * `sslmode` manda siempre que venga (en la URL o en PGSSLMODE). Si no viene, se
 * decide por la red: una dirección privada o un nombre sin punto es una red
 * interna —Docker, compose, `*.internal`— y ahí no hay TLS; cualquier otra cosa
 * es un Postgres gestionado accesible por internet, que sí lo exige.
 *
 * El rejectUnauthorized:false es deliberado: el Postgres gestionado de Render y
 * de Railway presenta un certificado que no encadena a una CA pública.
 */
export function sslPara(url, sslmodeEnv) {
  const modo = sslmodeEnv || new URLSearchParams(safeQuery(url)).get('sslmode');
  if (modo === 'disable') return false;
  if (modo) return { rejectUnauthorized: modo === 'verify-full' || modo === 'verify-ca' };
  return esRedInterna(safeHost(url)) ? false : { rejectUnauthorized: false };
}

export function esRedInterna(host) {
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.internal') || host.endsWith('.local')) return true;
  if (!host.includes('.')) return true;                 // nombre de servicio de compose/k8s
  const octetos = host.split('.').map(Number);
  if (octetos.length !== 4 || octetos.some(Number.isNaN)) return false;   // es un dominio
  const [a, b] = octetos;
  return (
    a === 127 ||                                        // loopback
    a === 10 ||                                         // 10.0.0.0/8
    (a === 172 && b >= 16 && b <= 31) ||                // 172.16.0.0/12 (Docker)
    (a === 192 && b === 168) ||                         // 192.168.0.0/16
    (a === 169 && b === 254)                            // link-local
  );
}

function safeHost(url) {
  try { return new URL(url).hostname; } catch { return ''; }
}

function safeQuery(url) {
  try { return new URL(url).search; } catch { return ''; }
}

// El esquema entra por variable de entorno y va concatenado en el startup
// packet: no se puede parametrizar, así que se valida como identificador.
function aseguraIdentificador(nombre) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(nombre || '')) {
    throw new Error(`GT_DB_SCHEMA inválido: ${nombre}`);
  }
  return nombre;
}
