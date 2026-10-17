import assert from 'node:assert/strict';
import test from 'node:test';
import { config } from '../vercel.mjs';

test('production configuration keeps publishing cron and has no global noindex header', () => {
  assert.deepEqual(config.crons, [
    { path: '/api/cron/publish', schedule: '*/5 * * * *' },
  ]);
  assert.equal(config.headers.some((rule) => rule.source === '/:path*'), false);
});
