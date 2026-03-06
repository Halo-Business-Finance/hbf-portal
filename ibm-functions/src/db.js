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
  let raw = process.env.IBM_DB_CA_CERT;
  if (!raw) return undefined;

  // Handle base64-encoded certs (no PEM header)
  if (!raw.includes('-----BEGIN')) {
    try {
      raw = Buffer.from(raw, 'base64').toString('utf-8');
    } catch {
      // not base64, use as-is
    }
  }

  // If it already has proper newlines, return as-is
  if (raw.includes('-----BEGIN CERTIFICATE-----\n')) return raw;

  // Fix single-line PEM: extract base64 body and reformat with 64-char lines
  if (raw.includes('-----BEGIN CERTIFICATE-----')) {
    const body = raw
      .replace('-----BEGIN CERTIFICATE-----', '')
      .replace('-----END CERTIFICATE-----', '')
      .replace(/\s+/g, '');
    const lines = body.match(/.{1,64}/g) || [];
    return '-----BEGIN CERTIFICATE-----\n' + lines.join('\n') + '\n-----END CERTIFICATE-----\n';
  }

  return raw;
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
