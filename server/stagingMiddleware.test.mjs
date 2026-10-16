import assert from 'node:assert/strict';
import test from 'node:test';
import { stagingAuthenticationResponse } from '../middleware.js';

const credentials = {
  VERCEL_TARGET_ENV: 'staging',
  STAGING_BASIC_AUTH_USER: 'qa',
  STAGING_BASIC_AUTH_PASSWORD: 'correct horse battery staple',
};

test('production requests are not gated by staging authentication', () => {
  const response = stagingAuthenticationResponse(
    new Request('https://www.technoedgels.com/'),
    { VERCEL_TARGET_ENV: 'production' },
  );
  assert.equal(response, null);
});

test('staging fails closed when credentials are not configured', () => {
  const response = stagingAuthenticationResponse(
    new Request('https://training-catalogue-staging.vercel.app/'),
    { VERCEL_TARGET_ENV: 'staging' },
  );
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
});

test('staging challenges invalid credentials', () => {
  const response = stagingAuthenticationResponse(
    new Request('https://training-catalogue-staging.vercel.app/', {
      headers: { authorization: `Basic ${btoa('qa:wrong')}` },
    }),
    credentials,
  );
  assert.equal(response.status, 401);
  assert.match(response.headers.get('www-authenticate'), /TechnoEdge Staging/);
});

test('staging accepts the configured credentials', () => {
  const response = stagingAuthenticationResponse(
    new Request('https://training-catalogue-staging.vercel.app/', {
      headers: { authorization: `Basic ${btoa('qa:correct horse battery staple')}` },
    }),
    credentials,
  );
  assert.equal(response, null);
});
