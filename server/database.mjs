import pg from 'pg';
import fs from 'node:fs';
import { assertDatabaseEnvironmentIsSafe } from './deploymentEnvironment.mjs';

const { Pool } = pg;
let pool;

function createSslConfiguration(connectionUrl) {
  const urlSslMode = connectionUrl.searchParams.get('sslmode');
  const sslMode = (process.env.DATABASE_SSL_MODE || urlSslMode || 'require').trim().toLowerCase();
  connectionUrl.searchParams.delete('sslmode');
  connectionUrl.searchParams.delete('uselibpqcompat');

  if (sslMode === 'disable') return false;
  if (sslMode === 'verify-full' || sslMode === 'verify-ca') {
    const certificatePath = process.env.DATABASE_SSL_ROOT_CERT?.trim();
    if (!certificatePath) {
      throw new Error('DATABASE_SSL_ROOT_CERT is required when DATABASE_SSL_MODE verifies the server certificate.');
    }
    return {
      ca: fs.readFileSync(certificatePath, 'utf8'),
      rejectUnauthorized: true,
    };
  }
  if (sslMode !== 'require') {
    throw new Error('DATABASE_SSL_MODE must be disable, require, verify-ca, or verify-full.');
  }

  // PostgreSQL sslmode=require encrypts the connection without CA/hostname verification.
  return { rejectUnauthorized: false };
}

export function getPool() {
  if (pool) return pool;

  assertDatabaseEnvironmentIsSafe();
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is required. Copy .env.example to .env and provide a PostgreSQL connection string.');
  }

  const configuredPoolMax = Number.parseInt(process.env.DATABASE_POOL_MAX || '10', 10);
  const connectionUrl = new URL(connectionString);
  const ssl = createSslConfiguration(connectionUrl);
  pool = new Pool({
    connectionString: connectionUrl.toString(),
    ssl,
    max: Number.isInteger(configuredPoolMax) && configuredPoolMax > 0 ? configuredPoolMax : 10,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  });

  pool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error.message);
  });

  return pool;
}

export async function closePool() {
  if (!pool) return;
  const activePool = pool;
  pool = undefined;
  await activePool.end();
}
