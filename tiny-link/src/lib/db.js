// src/lib/db.js
import pkg from 'pg';
const { Pool } = pkg;

let pool;

if (!globalThis.__pgPool) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  globalThis.__pgPool = pool;
} else {
  pool = globalThis.__pgPool;
}

export default pool;
