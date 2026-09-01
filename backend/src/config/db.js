import pg from 'pg';
import { env } from './env.js';

// Pool de conexiones al PostgreSQL compartido del monolito.
export const pool = new pg.Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  max: 10,
  idleTimeoutMillis: 30000,
});

// Fija el search_path al esquema del módulo en cada conexión nueva.
pool.on('connect', (client) => {
  client.query(`SET search_path TO ${env.db.schema}, public`);
});

export const query = (text, params) => pool.query(text, params);
