// Corre las migraciones SQL en orden. Uso: npm run migrate
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../../../db/migrations');

const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
for (const f of files) {
  const sql = await readFile(path.join(MIGRATIONS_DIR, f), 'utf8');
  console.log('→ aplicando', f);
  await pool.query(sql);
}
console.log('✓ migraciones aplicadas');
await pool.end();
