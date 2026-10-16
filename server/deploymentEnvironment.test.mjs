import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertDatabaseEnvironmentIsSafe,
  assertStagingConfiguration,
  deploymentEnvironment,
} from './deploymentEnvironment.mjs';

const stagingEnvironment = {
  APP_ENV: 'staging',
  NON_PRODUCTION_DATA_ISOLATION_CONFIRMED: 'true',
  DATABASE_URL: 'postgresql://staging:secret@db.staging.example/staging',
  DATABASE_SSL_MODE: 'require',
  LEADS_STORAGE_MODE: 'postgres',
  SUPABASE_URL: 'https://staging-project.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'staging-publishable-key',
  SUPABASE_SERVICE_ROLE_KEY: 'staging-service-role-key',
  SUPABASE_STORAGE_BUCKET: 'technoedge-media-staging',
  ADMIN_OWNER_EMAIL: 'staging-owner@example.com',
  ADMIN_ORIGIN: 'https://training-catalogue-staging.vercel.app',
  ADMIN_IP_HASH_SALT: 'staging-salt',
  CRON_SECRET: 'staging-cron-secret',
  APP_URL: 'https://training-catalogue-staging.vercel.app',
  STAGING_BASIC_AUTH_USER: 'qa',
  STAGING_BASIC_AUTH_PASSWORD: 'staging-password',
};

test('custom Vercel target wins when resolving the deployment environment', () => {
  assert.equal(deploymentEnvironment({
    VERCEL_TARGET_ENV: 'staging',
    APP_ENV: 'production',
    VERCEL_ENV: 'preview',
  }), 'staging');
});

test('production and local development do not require the non-production acknowledgement', () => {
  assert.equal(assertDatabaseEnvironmentIsSafe({ APP_ENV: 'production' }), 'production');
  assert.equal(assertDatabaseEnvironmentIsSafe({}), 'development');
});

test('preview database access is locked until isolation is confirmed', () => {
  assert.throws(
    () => assertDatabaseEnvironmentIsSafe({ VERCEL_ENV: 'preview' }),
    /database access is locked/,
  );
});

test('non-production cannot point application URLs at production', () => {
  assert.throws(
    () => assertDatabaseEnvironmentIsSafe({
      VERCEL_TARGET_ENV: 'staging',
      NON_PRODUCTION_DATA_ISOLATION_CONFIRMED: 'true',
      APP_URL: 'https://www.technoedgels.com',
    }),
    /production hostname/,
  );
});

test('complete isolated staging configuration passes validation', () => {
  assert.equal(assertStagingConfiguration(stagingEnvironment), 'staging');
});

test('staging requires PostgreSQL lead storage', () => {
  assert.throws(
    () => assertStagingConfiguration({ ...stagingEnvironment, LEADS_STORAGE_MODE: 'hybrid' }),
    /must be postgres/,
  );
});
