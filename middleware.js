import { next } from '@vercel/functions';

const restrictedHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

function environmentName(environment) {
  return String(
    environment.VERCEL_TARGET_ENV || environment.APP_ENV || environment.VERCEL_ENV || 'development',
  ).trim().toLowerCase();
}

function constantTimeEqual(left, right) {
  const maximumLength = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < maximumLength; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

export function stagingAuthenticationResponse(request, environment = process.env) {
  if (environmentName(environment) !== 'staging') return null;

  const username = String(environment.STAGING_BASIC_AUTH_USER || '').trim();
  const password = String(environment.STAGING_BASIC_AUTH_PASSWORD || '');
  if (!username || !password) {
    return new Response('Staging access is not configured.', {
      status: 503,
      headers: restrictedHeaders,
    });
  }

  const provided = request.headers.get('authorization') || '';
  const expected = `Basic ${btoa(`${username}:${password}`)}`;
  if (!constantTimeEqual(provided, expected)) {
    return new Response('Authentication required.', {
      status: 401,
      headers: {
        ...restrictedHeaders,
        'WWW-Authenticate': 'Basic realm="TechnoEdge Staging", charset="UTF-8"',
      },
    });
  }

  return null;
}

export default function middleware(request) {
  const authenticationResponse = stagingAuthenticationResponse(request);
  if (authenticationResponse) return authenticationResponse;
  if (environmentName(process.env) === 'staging') {
    return next({ headers: { 'X-Robots-Tag': 'noindex, nofollow, noarchive' } });
  }
  return next();
}

export const config = {
  matcher: '/:path*',
};
