import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import dotenv from 'dotenv';

const stagingEnvironmentPath = path.resolve('.vercel/.env.staging.local');
const environmentKeys = [
  'APP_ENV',
  'APP_URL',
  'NON_PRODUCTION_DATA_ISOLATION_CONFIRMED',
  'DATABASE_URL',
  'DATABASE_POOL_MAX',
  'DATABASE_SSL_MODE',
  'DATABASE_SSL_ROOT_CERT',
  'LEADS_STORAGE_MODE',
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_STORAGE_BUCKET',
  'ADMIN_OWNER_EMAIL',
  'ADMIN_ORIGIN',
  'ADMIN_IP_HASH_SALT',
  'CRON_SECRET',
  'RESEND_API_KEY',
  'ADMIN_EMAIL_FROM',
  'ADMIN_NOTIFICATION_EMAIL',
  'INDEXNOW_KEY',
  'STAGING_BASIC_AUTH_USER',
  'STAGING_BASIC_AUTH_PASSWORD',
];

const actions = {
  check: ['node', ['scripts/validate-staging-environment.mjs']],
  build: ['npm', ['run', 'build']],
  migrate: ['npm', ['run', 'db:migrate']],
};

const action = process.argv[2];
if (!actions[action]) {
  throw new Error(`Unknown staging action: ${action || '(missing)'}. Use check, build, or migrate.`);
}

let pulledEnvironment;
try {
  pulledEnvironment = dotenv.parse(await readFile(stagingEnvironmentPath));
} catch (error) {
  if (error?.code === 'ENOENT') {
    throw new Error('Staging variables have not been pulled. Run npm run staging:pull first.');
  }
  throw error;
}

const childEnvironment = { ...process.env };
for (const key of environmentKeys) childEnvironment[key] = '';
Object.assign(childEnvironment, pulledEnvironment, {
  APP_ENV: 'staging',
  VERCEL: '1',
  VERCEL_ENV: 'preview',
  VERCEL_TARGET_ENV: 'staging',
});

const [program, baseArguments] = actions[action];
let executable = program;
let argumentsList = baseArguments;
if (program === 'npm') {
  if (!process.env.npm_execpath) {
    throw new Error('Run this staging action through npm so the npm executable can be resolved safely.');
  }
  executable = process.execPath;
  argumentsList = [process.env.npm_execpath, ...baseArguments];
}

const child = spawn(executable, argumentsList, {
  cwd: process.cwd(),
  env: childEnvironment,
  stdio: 'inherit',
});

child.once('error', (error) => {
  throw error;
});
child.once('exit', (code, signal) => {
  if (signal) {
    console.error(`Staging ${action} stopped by signal ${signal}.`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
