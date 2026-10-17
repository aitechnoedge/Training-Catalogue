import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as vercel } from '../vercel.mjs';

const SITE_ORIGIN = 'https://www.technoedgels.com';
const CATALOGUE_DIRECTORY_PAGE_SIZE = 48;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = path.join(projectRoot, 'public');
const buildDirectory = path.join(projectRoot, 'dist');
const childSitemaps = [
  'sitemap-pages.xml',
  'sitemap-programmes.xml',
  'sitemap-insights.xml',
  'sitemap-careers.xml',
];

const read = (directory, filename) => readFile(path.join(directory, filename), 'utf8');
const locations = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

const [robots, sitemapIndex] = await Promise.all([
  read(buildDirectory, 'robots.txt'),
  read(buildDirectory, 'sitemap.xml'),
]);

assert.match(robots, /^User-agent: \*$/m);
assert.match(robots, /^Allow: \/$/m);
assert.match(robots, /^Disallow: \/admin\/$/m);
assert.match(robots, /^Disallow: \/api\/admin\/$/m);
assert.match(robots, /^Disallow: \/api\/$/m);
assert.match(robots, /^User-agent: OAI-SearchBot$/m);
assert.match(robots, /^User-agent: GPTBot$/m);
assert.match(robots, new RegExp(`^Sitemap: ${SITE_ORIGIN.replaceAll('.', '\\.')}\/sitemap\\.xml$`, 'm'));

const expectedSitemapUrls = childSitemaps.map((filename) => `${SITE_ORIGIN}/${filename}`);
assert.deepEqual(locations(sitemapIndex), expectedSitemapUrls);

const allPageUrls = [];
for (const filename of childSitemaps) {
  const [sourceXml, builtXml] = await Promise.all([
    read(sourceDirectory, filename),
    read(buildDirectory, filename),
  ]);
  assert.equal(builtXml, sourceXml, `${filename} differs between public/ and dist/.`);
  assert.match(builtXml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);

  const urls = locations(builtXml);
  assert.ok(urls.length > 0, `${filename} must contain at least one URL.`);
  assert.ok(urls.length <= 50_000, `${filename} exceeds the sitemap URL limit.`);
  allPageUrls.push(...urls);
}

assert.equal(new Set(allPageUrls).size, allPageUrls.length, 'Sitemap URLs must be unique across child files.');
for (const value of allPageUrls) {
  const url = new URL(value);
  assert.equal(url.origin, SITE_ORIGIN, `Unexpected sitemap origin: ${value}`);
  assert.equal(url.search, '', `Sitemap URL contains a query string: ${value}`);
  assert.equal(url.hash, '', `Sitemap URL contains a fragment: ${value}`);
  assert.doesNotMatch(url.pathname, /^\/(?:admin|api|website)(?:\/|$)/, `Private or duplicate route leaked into sitemap: ${value}`);
  assert.doesNotMatch(url.pathname, /insight-placeholder|\/(?:ai|latest|popular)-\d+$/, `Draft insight leaked into sitemap: ${value}`);
}

for (const expected of ['/', '/catalogue', '/e-learning/', '/insights', '/careers', '/training-roi']) {
  assert.ok(allPageUrls.includes(`${SITE_ORIGIN}${expected}`), `Missing required canonical URL: ${expected}`);
}

const programmeXml = await read(buildDirectory, 'sitemap-programmes.xml');
const programmeUrls = locations(programmeXml);
assert.ok(programmeUrls.length >= 1, 'Programme sitemap must not be empty.');
for (const value of programmeUrls) {
  assert.match(new URL(value).pathname, /^\/programmes\/(?:RB|PP|TT|TC|CER)\d{4,}$/);
}

const expectedCataloguePages = Math.ceil(programmeUrls.length / CATALOGUE_DIRECTORY_PAGE_SIZE);
const paginatedCatalogueUrls = allPageUrls.filter((value) => /^\/catalogue\/page\/(?:[2-9]|[1-9]\d+)$/.test(new URL(value).pathname));
assert.equal(
  paginatedCatalogueUrls.length,
  Math.max(0, expectedCataloguePages - 1),
  'Catalogue directory page count does not match the indexable programme count.',
);
for (let page = 2; page <= expectedCataloguePages; page += 1) {
  assert.ok(
    paginatedCatalogueUrls.includes(`${SITE_ORIGIN}/catalogue/page/${page}`),
    `Missing catalogue directory page ${page} from the sitemap.`,
  );
}

const [corporateHtml, learningHtml, homeHtml, sharedHtml] = await Promise.all([
  read(buildDirectory, 'website/index.html'),
  read(buildDirectory, 'e-learning/index.html'),
  read(buildDirectory, 'index.html'),
  read(buildDirectory, 'app-shell.html'),
]);
assert.match(corporateHtml, /<link rel="canonical" href="https:\/\/www\.technoedgels\.com\/"\s*\/?>/);
assert.match(learningHtml, /<link rel="canonical" href="https:\/\/www\.technoedgels\.com\/e-learning\/"\s*\/?>/);
assert.equal(homeHtml, corporateHtml, 'The deployed root document must be the fully rendered corporate Home page.');
assert.doesNotMatch(sharedHtml, /<link rel="canonical"/, 'The shared SPA shell must not hard-code one route as canonical.');
for (const [name, html] of [['corporate', corporateHtml], ['e-learning', learningHtml]]) {
  assert.doesNotMatch(html, /<div id="root">\s*<link\b/i, `${name} resource hints must be hoisted outside the hydration root.`);
}

const corporateGalleryWebpSources = [...corporateHtml.matchAll(/<source\b[^>]*>/gi)]
  .map(([tag]) => tag)
  .filter((tag) => /\btype="image\/webp"/i.test(tag) && tag.includes('/website/assets/training-media/'))
  .map((tag) => tag.match(/(\/website\/assets\/training-media\/[^\s,\"]+-1200\.webp)\s+1200w/i)?.[1]);
assert.ok(corporateGalleryWebpSources.every(Boolean), 'Every gallery WebP source must include a 1200 px image.');
assert.equal(new Set(corporateGalleryWebpSources).size, 16, 'Corporate gallery must expose all 16 optimized WebP sources.');
assert.equal(corporateGalleryWebpSources.length, 16, 'Corporate gallery WebP source markup must not be duplicated.');
for (const source of corporateGalleryWebpSources) {
  await assert.doesNotReject(access(path.join(buildDirectory, source.replace(/^\//, ''))), `Missing optimized gallery asset: ${source}`);
}
const corporateGalleryFallbacks = [...corporateHtml.matchAll(/<img\b[^>]*>/gi)]
  .map(([tag]) => tag)
  .filter((tag) => /\bsrc="\/website\/assets\/training-media\/[^\"]+\.(?:jpe?g)"/i.test(tag))
  .filter((tag) => /\bwidth="\d+"/i.test(tag) && /\bheight="\d+"/i.test(tag))
  .filter((tag) => /\bloading="lazy"/i.test(tag) && /\bdecoding="async"/i.test(tag));
assert.equal(corporateGalleryFallbacks.length, 16, 'Corporate gallery images must retain fallback sources and intrinsic dimensions.');

const routeFile = (pathname) => {
  if (pathname === '/') return path.join(buildDirectory, 'website', 'index.html');
  if (pathname === '/website/' || pathname === '/website') return path.join(buildDirectory, 'website', 'index.html');
  if (pathname === '/e-learning/') return path.join(buildDirectory, 'e-learning', 'index.html');
  return path.join(buildDirectory, `${pathname.replace(/^\//, '').replace(/\/$/, '')}.html`);
};
const firstMatch = (html, pattern) => pattern.exec(html)?.[1]?.trim() || '';
const normalizeHtmlText = (value) => value
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z0-9#]+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const catalogueInitialHtml = await readFile(routeFile('/catalogue'), 'utf8');
const catalogueEntryScript = firstMatch(catalogueInitialHtml, /<script\b[^>]*\bsrc="(\/assets\/index-[^"]+\.js)"[^>]*><\/script>/i);
const catalogueEntryStylesheet = firstMatch(catalogueInitialHtml, /<link\b[^>]*\bhref="(\/assets\/index-[^"]+\.css)"[^>]*>/i);
assert.ok(catalogueEntryScript, 'Catalogue page is missing its client entry script.');
assert.ok(catalogueEntryStylesheet, 'Catalogue page is missing its client stylesheet.');
const [entryScriptStats, entryStylesheetStats] = await Promise.all([
  stat(path.join(buildDirectory, catalogueEntryScript.replace(/^\//, ''))),
  stat(path.join(buildDirectory, catalogueEntryStylesheet.replace(/^\//, ''))),
]);
assert.ok(entryScriptStats.size <= 450 * 1024, `Initial catalogue JavaScript exceeds the 450 KB budget (${entryScriptStats.size} bytes).`);
assert.ok(entryStylesheetStats.size <= 190 * 1024, `Initial catalogue CSS exceeds the 190 KB budget (${entryStylesheetStats.size} bytes).`);
assert.match(catalogueInitialHtml, /Exclusive Corporate[\s\S]*Training Catalogue/, 'The catalogue H1 must remain in initial HTML.');
assert.match(catalogueInitialHtml, /id="category-selection-section"/, 'The category navigation must remain in initial HTML.');
assert.doesNotMatch(catalogueInitialHtml, /id="floating-utility-actions"/, 'Non-critical support UI must stay out of the initial HTML.');

const seenTitles = new Map();
const seenDescriptions = new Map();
const internalLinks = new Map();
for (const value of allPageUrls) {
  const url = new URL(value);
  const html = await readFile(routeFile(url.pathname), 'utf8');
  const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i);
  const description = firstMatch(html, /<meta\s+name="description"\s+content="([^"]+)"\s*\/?\s*>/i);
  const robotsDirective = firstMatch(html, /<meta\s+name="robots"\s+content="([^"]+)"\s*\/?\s*>/i);
  const canonical = firstMatch(html, /<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?\s*>/i);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const mainContent = firstMatch(html, /<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const headingLevels = [...mainContent.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));

  assert.doesNotMatch(html, /<div id="root">\s*<link\b/i, `Resource hints must be hoisted outside the hydration root for ${url.pathname}`);

  assert.ok(title, `Missing title in initial HTML for ${url.pathname}`);
  assert.ok(description, `Missing description in initial HTML for ${url.pathname}`);
  assert.match(robotsDirective, /^index, follow/, `Sitemap URL is not indexable: ${url.pathname}`);
  assert.equal(canonical, value, `Canonical mismatch for ${url.pathname}`);
  assert.equal(h1Count, 1, `Expected exactly one H1 in initial HTML for ${url.pathname}`);
  assert.equal(headingLevels[0], 1, `Primary content must begin with an H1 for ${url.pathname}`);
  for (let index = 1; index < headingLevels.length; index += 1) {
    assert.ok(
      headingLevels[index] <= headingLevels[index - 1] + 1,
      `Heading hierarchy skips from H${headingLevels[index - 1]} to H${headingLevels[index]} for ${url.pathname}`,
    );
  }
  assert.ok(normalizeHtmlText(html).length >= 300, `Initial HTML is too thin for ${url.pathname}`);
  if (url.pathname.startsWith('/insights/')) {
    assert.match(html, /"@type":"BlogPosting"/, `Indexable insight lacks BlogPosting structured data: ${url.pathname}`);
    assert.match(html, /Sources and further reading/, `Indexable insight lacks visible evidence links: ${url.pathname}`);
    assert.match(html, /"reviewedBy":/, `Indexable insight lacks reviewer structured data: ${url.pathname}`);
  }
  if (url.pathname.startsWith('/careers/')) {
    assert.match(html, /"@type":"JobPosting"/, `Indexable career route lacks JobPosting structured data: ${url.pathname}`);
    assert.match(html, /"validThrough":/, `Indexable career route lacks an expiry date: ${url.pathname}`);
    assert.match(html, /Apply by email/, `Indexable career route lacks a direct application path: ${url.pathname}`);
  }
  assert.ok(!seenTitles.has(title), `Duplicate title between ${seenTitles.get(title)} and ${url.pathname}`);
  assert.ok(!seenDescriptions.has(description), `Duplicate description between ${seenDescriptions.get(description)} and ${url.pathname}`);
  seenTitles.set(title, url.pathname);
  seenDescriptions.set(description, url.pathname);

  for (const match of html.matchAll(/<a\b[^>]*\bhref=(['"])(.*?)\1/gi)) {
    const href = match[2].replaceAll('&amp;', '&');
    if (!href || href.startsWith('#') || /^(?:mailto|tel|javascript):/i.test(href)) continue;
    const linkedUrl = new URL(href, SITE_ORIGIN);
    if (linkedUrl.origin !== SITE_ORIGIN || linkedUrl.pathname.startsWith('/api/')) continue;
    if (!internalLinks.has(linkedUrl.pathname)) internalLinks.set(linkedUrl.pathname, url.pathname);
  }
}

for (const [pathname, sourcePath] of internalLinks) {
  const target = /\.[a-z0-9]{2,8}$/i.test(pathname)
    ? path.join(buildDirectory, pathname.replace(/^\//, ''))
    : routeFile(pathname);
  await assert.doesNotReject(
    access(target),
    `Broken internal link from ${sourcePath}: ${pathname}`,
  );
}

for (let page = 1; page <= expectedCataloguePages; page += 1) {
  const pathname = page === 1 ? '/catalogue' : `/catalogue/page/${page}`;
  const html = await readFile(routeFile(pathname), 'utf8');
  const programmeLinks = [...html.matchAll(/<a\b[^>]*\bhref=(['"])(\/programmes\/(?:RB|PP|TT|TC|CER)\d{4,})\1/gi)]
    .map((match) => match[2]);
  const expectedLinks = page === expectedCataloguePages
    ? programmeUrls.length - ((page - 1) * CATALOGUE_DIRECTORY_PAGE_SIZE)
    : CATALOGUE_DIRECTORY_PAGE_SIZE;
  assert.equal(new Set(programmeLinks).size, expectedLinks, `Unexpected programme-link count on ${pathname}.`);
  if (page < expectedCataloguePages) {
    assert.match(html, new RegExp(`href=["']\/catalogue\/page\/${page + 1}["']`), `${pathname} lacks a crawlable next-page link.`);
  }
}

const careersHtml = await readFile(routeFile('/careers'), 'utf8');
assert.match(careersHtml, /<a\b[^>]*href=["']\/careers\/designer["']/i, 'Career openings must use crawlable links.');

const [sourceFeed, builtFeed] = await Promise.all([
  read(sourceDirectory, 'insights.xml'),
  read(buildDirectory, 'insights.xml'),
]);
assert.equal(builtFeed, sourceFeed, 'insights.xml differs between public/ and dist/.');
assert.match(builtFeed, /<rss version="2\.0"[^>]*xmlns:atom=/);
assert.match(builtFeed, /<atom:link href="https:\/\/www\.technoedgels\.com\/insights\.xml" rel="self" type="application\/rss\+xml"\s*\/>/);
const insightXml = await read(buildDirectory, 'sitemap-insights.xml');
const indexedInsightUrls = locations(insightXml).filter((value) => new URL(value).pathname.startsWith('/insights/'));
const feedLinks = [...builtFeed.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<\/item>/g)].map((match) => match[1]);
assert.deepEqual(
  [...feedLinks].sort(),
  [...indexedInsightUrls].sort(),
  'The RSS feed must contain precisely the indexable insight detail URLs.',
);

const qualityReport = JSON.parse(await readFile(path.join(projectRoot, 'artifacts', 'seo', 'programme-quality-report.json'), 'utf8'));
const heldProgrammeId = qualityReport.remediationProgrammes?.[0]?.course_id;
assert.ok(heldProgrammeId, 'Quality report must contain at least one held programme for noindex verification.');
const heldProgrammePath = `/programmes/${heldProgrammeId}`;
const heldProgrammeHtml = await readFile(routeFile(heldProgrammePath), 'utf8');
assert.match(
  firstMatch(heldProgrammeHtml, /<meta\s+name="robots"\s+content="([^"]+)"\s*\/?\s*>/i),
  /^noindex, follow/,
  `Held programme must be noindex: ${heldProgrammePath}`,
);
assert.ok(!programmeUrls.includes(`${SITE_ORIGIN}${heldProgrammePath}`), `Held programme leaked into sitemap: ${heldProgrammePath}`);
assert.equal((heldProgrammeHtml.match(/<h1\b/gi) || []).length, 1, `Held programme lacks complete static HTML: ${heldProgrammePath}`);

const careerQualityReport = JSON.parse(await readFile(path.join(projectRoot, 'artifacts', 'seo', 'career-quality-report.json'), 'utf8'));
for (const job of careerQualityReport.jobs) {
  const pathname = `/careers/${job.slug}`;
  const html = await readFile(routeFile(pathname), 'utf8');
  const sitemapUrl = `${SITE_ORIGIN}${pathname}`;
  if (job.approvedForIndexing) {
    assert.ok(allPageUrls.includes(sitemapUrl), `Approved career route is missing from the sitemap: ${pathname}`);
  } else {
    assert.ok(!allPageUrls.includes(sitemapUrl), `Held career route leaked into the sitemap: ${pathname}`);
    assert.match(
      firstMatch(html, /<meta\s+name="robots"\s+content="([^"]+)"\s*\/?\s*>/i),
      /^noindex, follow/,
      `Held career route must be noindex: ${pathname}`,
    );
  }
}

const notFoundHtml = await read(buildDirectory, '404.html');
assert.match(notFoundHtml, /<meta\s+name="robots"\s+content="noindex, follow"/i);
assert.match(notFoundHtml, /<h1\b[^>]*>Page not found<\/h1>/i);

assert.ok(vercel.redirects.some((rule) => rule.source === '/e-learning' && rule.destination === '/e-learning/' && rule.permanent === true));
assert.ok(vercel.rewrites.some((rule) => rule.source === '/' && rule.destination === '/website'));
assert.equal(vercel.cleanUrls, true, 'Clean URLs must be enabled for prerendered HTML routes.');
for (const forbidden of ['/programmes/:path*', '/insights/:path*', '/careers/:path*', '/website/:path*', '/e-learning/:path*']) {
  assert.ok(!vercel.rewrites.some((rule) => rule.source === forbidden), `Catch-all rewrite would create soft 200 responses: ${forbidden}`);
}

console.log(`SEO verification passed for ${allPageUrls.length} canonical URLs.`);
