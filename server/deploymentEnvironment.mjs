const PRODUCTION_HOSTS = new Set([
  'technoedgels.com',
  'www.technoedgels.com',
]);

function normalized(value) {
  return String(value || '').trim().toLowerCase();
}

function configuredUrl(value, name) {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute URL.`);
  }
}

export function deploymentEnvironment(environment = process.env) {
  return normalized(
    environment.VERCEL_TARGET_ENV
      || environment.APP_ENV
      || environment.VERCEL_ENV
      || 'development',
  );
}

export function isProductionDeployment(environment = process.env) {
  return deploymentEnvironment(environment) === 'production';
}

export function assertDatabaseEnvironmentIsSafe(environment = process.env) {
  const target = deploymentEnvironment(environment);
  if (target === 'production' || target === 'development') return target;

  if (normalized(environment.NON_PRODUCTION_DATA_ISOLATION_CONFIRMED) !== 'true') {
    throw new Error(
      `${target} database access is locked. Set NON_PRODUCTION_DATA_ISOLATION_CONFIRMED=true only after DATABASE_URL, Supabase, storage, admin, and email credentials are isolated from production.`,
    );
  }

  for (const name of ['APP_URL', 'ADMIN_ORIGIN']) {
    const url = configuredUrl(environment[name], name);
    if (url && PRODUCTION_HOSTS.has(url.hostname.toLowerCase())) {
      throw new Error(`${name} cannot use the production hostname in ${target}.`);
    }
  }

  return target;
}

export function assertStagingConfiguration(environment = process.env) {
  const target = deploymentEnvironment(environment);
  if (target !== 'staging') {
    throw new Error(`Expected the staging environment, but resolved ${target}. Set APP_ENV=staging.`);
  }

  const required = [
    'DATABASE_URL',
    'DATABASE_SSL_MODE',
    'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_STORAGE_BUCKET',
    'ADMIN_OWNER_EMAIL',
    'ADMIN_ORIGIN',
    'ADMIN_IP_HASH_SALT',
    'CRON_SECRET',
    'APP_URL',
    'STAGING_BASIC_AUTH_USER',
    'STAGING_BASIC_AUTH_PASSWORD',
  ];
  const missing = required.filter((name) => !String(environment[name] || '').trim());
  if (missing.length) {
    throw new Error(`Staging is missing required variables: ${missing.join(', ')}.`);
  }

  if (normalized(environment.LEADS_STORAGE_MODE) !== 'postgres') {
    throw new Error('LEADS_STORAGE_MODE must be postgres in staging.');
  }

  const appUrl = configuredUrl(environment.APP_URL, 'APP_URL');
  const adminOrigin = configuredUrl(environment.ADMIN_ORIGIN, 'ADMIN_ORIGIN');
  if (appUrl.protocol !== 'https:' || adminOrigin.protocol !== 'https:') {
    throw new Error('APP_URL and ADMIN_ORIGIN must use HTTPS in staging.');
  }
  if (appUrl.origin !== adminOrigin.origin) {
    throw new Error('APP_URL and ADMIN_ORIGIN must use the same staging origin.');
  }

  const databaseUrl = configuredUrl(environment.DATABASE_URL, 'DATABASE_URL');
  if (['localhost', '127.0.0.1', '::1'].includes(databaseUrl.hostname.toLowerCase())) {
    throw new Error('DATABASE_URL must point to a remotely reachable staging database.');
  }

  assertDatabaseEnvironmentIsSafe(environment);
  return target;
}
