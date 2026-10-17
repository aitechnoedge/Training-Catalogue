export const config = {
  framework: 'vite',
  cleanUrls: true,
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  // Vercel compiles this file before build-time environment variables are
  // available. Vercel schedules configured crons only on Production.
  crons: [{ path: '/api/cron/publish', schedule: '*/5 * * * *' }],
  redirects: [
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'technoedgels.com' }],
      destination: 'https://www.technoedgels.com/:path*',
      permanent: true,
    },
    { source: '/index.html', destination: '/', permanent: true },
    { source: '/e-learning', destination: '/e-learning/', permanent: true },
    { source: '/e-learning/index.html', destination: '/e-learning/', permanent: true },
    { source: '/catalogue/', destination: '/catalogue', permanent: true },
    { source: '/insights/', destination: '/insights', permanent: true },
    { source: '/careers/', destination: '/careers', permanent: true },
    { source: '/training-roi/', destination: '/training-roi', permanent: true },
  ],
  headers: [
    {
      source: '/adminzz/:path*',
      headers: [
        { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'same-origin' },
      ],
    },
    {
      source: '/api/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    },
    {
      source: '/website/assets/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/assets/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/media/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=604800' }],
    },
    {
      source: '/wp-content/uploads/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/preview/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
    },
  ],
  rewrites: [
    { source: '/api/:path*', destination: '/api/index' },
    { source: '/sitemap-insights.xml', destination: '/api/insights-sitemap' },
    { source: '/', destination: '/website' },
    { source: '/adminzz/:path*', destination: '/app-shell' },
  ],
};
