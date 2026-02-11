/**
 * IBM PostgreSQL connection pool.
 * Reads DATABASE_URL from environment and configures SSL with the IBM CA cert.
 */
import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is required');
  process.exit(1);
}

// Reconstruct CA cert from single-line env var if needed
function buildCaCert() {
  const raw = process.env.IBM_DB_CA_CERT;
  if (!raw) return undefined;
  // If it already has newlines it's fine; otherwise reformat
  if (raw.includes('\n')) return raw;
  return raw
    .replace('-----BEGIN CERTIFICATE-----', '-----BEGIN CERTIFICATE-----\n')
    .replace('-----END CERTIFICATE-----', '\n-----END CERTIFICATE-----\n')
    .replace(/(.{64})(?!-)/g, '$1\n');
}

const caCert = buildCaCert();

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: caCert
    ? { rejectUnauthorized: true, ca: caCert }
    : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});

export async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}

/**
 * Convenience: run a parameterized query.
 */
export async function query(text, params) {
  return pool.query(text, params);
}
