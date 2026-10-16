import 'dotenv/config';

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { closePool, getPool } from '../server/database.mjs';
import { listPublicBlogs } from '../server/blogRepository.mjs';
import { peopleProcessProgrammes } from '../src/data/peopleProcessProgrammes';
import { seoLandingPages } from '../src/data/seoLandingPages';
import { insightsArticles } from '../src/data/insightsData';
import { careerJobs } from '../src/data/careersData';
import { CATALOGUE_DIRECTORY_PAGE_SIZE, catalogueDirectoryPath } from '../src/seo/cataloguePagination';
import { isIndexableCareerJob } from '../src/seo/careerJobQuality';

const SITE_ORIGIN = 'https://www.technoedgels.com';
const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(projectRoot, 'public');

interface SitemapEntry {
  path: string;
  lastmod?: string;
}

interface PublishedProgrammeRow {
  course_id: string;
  updated_at: Date | string;
}

interface InsightFeedItem {
  url: string;
  title: string;
  excerpt: string;
  author: string;
  indexable: boolean;
  datePublished?: string;
  dateModified?: string;
}

const xmlEscape = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const canonicalUrl = (pathname: string) => new URL(pathname, `${SITE_ORIGIN}/`).href;

const isoDate = (value: Date | string | undefined) => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
};

const renderUrlSet = (entries: SitemapEntry[]) => {
  const urls = entries.map(({ path: pathname, lastmod }) => {
    const location = `    <loc>${xmlEscape(canonicalUrl(pathname))}</loc>`;
    const modified = lastmod ? `\n    <lastmod>${xmlEscape(lastmod)}</lastmod>` : '';
    return `  <url>\n${location}${modified}\n  </url>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="${SITEMAP_NAMESPACE}">`,
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
};

const renderSitemapIndex = (filenames: string[]) => [
  '<?xml version="1.0" encoding="UTF-8"?>',
  `<sitemapindex xmlns="${SITEMAP_NAMESPACE}">`,
  ...filenames.map((filename) => [
    '  <sitemap>',
    `    <loc>${xmlEscape(canonicalUrl(`/${filename}`))}</loc>`,
    '  </sitemap>',
  ].join('\n')),
  '</sitemapindex>',
  '',
].join('\n');

async function getPublishedProgrammes(): Promise<SitemapEntry[]> {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL is required to generate a complete sitemap from published catalogue records.');
  }

  const pool = getPool();

  try {
    const result = await pool.query<PublishedProgrammeRow>(`
      SELECT course_id, updated_at
      FROM catalogue.courses
      WHERE status = 'published'
        AND seo_indexable = true
        AND category_code IN ('role-based', 'tools-technology', 'technical-training', 'certifications')
      ORDER BY course_id
    `);

    const entries = new Map<string, SitemapEntry>();

    for (const row of result.rows) {
      const id = row.course_id.trim().toUpperCase();
      if (!/^(?:RB|TT|TC|CER)\d{4,}$/.test(id)) {
        throw new Error(`Published course has a non-canonical ID and cannot enter the sitemap: ${row.course_id}`);
      }
      entries.set(id, { path: `/programmes/${id}`, lastmod: isoDate(row.updated_at) });
    }

    for (const programme of peopleProcessProgrammes) {
      const id = programme.id.trim().toUpperCase();
      if (!/^PP\d{4,}$/.test(id)) {
        throw new Error(`People & Process programme has a non-canonical ID: ${programme.id}`);
      }
      entries.set(id, { path: `/programmes/${id}` });
    }

    if (entries.size === 0) {
      throw new Error('The programme sitemap would be empty; sitemap generation has been stopped.');
    }

    return [...entries.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, entry]) => entry);
  } finally {
    await closePool();
  }
}

async function getManagedInsights(): Promise<InsightFeedItem[]> {
  const pool = getPool();
  try {
    return await listPublicBlogs(pool, { limit: 500 });
  } finally {
    await closePool();
  }
}

const feedDate = (value: string | undefined) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toUTCString();
};

const renderRssItem = (article: InsightFeedItem) => {
  const date = feedDate(article.datePublished ?? article.dateModified);
  return [
    '    <item>',
    `      <title>${xmlEscape(article.title)}</title>`,
    `      <link>${xmlEscape(canonicalUrl(article.url))}</link>`,
    `      <guid isPermaLink="true">${xmlEscape(canonicalUrl(article.url))}</guid>`,
    `      <description>${xmlEscape(article.excerpt)}</description>`,
    article.author ? `      <dc:creator>${xmlEscape(article.author)}</dc:creator>` : '',
    date ? `      <pubDate>${xmlEscape(date)}</pubDate>` : '',
    '    </item>',
  ].filter(Boolean).join('\n');
};

async function main() {
  const programmeEntries = await getPublishedProgrammes();
  const managedInsights = await getManagedInsights();
  const landingEntries = seoLandingPages.map((page) => ({ path: page.path, lastmod: page.updated }));
  const indexableInsights = [
    ...insightsArticles.filter((article) => article.indexable),
    ...managedInsights.filter((article) => article.indexable),
  ];
  const insightEntries = new Map<string, SitemapEntry>();
  for (const article of indexableInsights) {
    insightEntries.set(article.url, {
      path: article.url,
      lastmod: isoDate(article.dateModified ?? article.datePublished),
    });
  }
  const careerEntries = careerJobs
    .filter((job) => isIndexableCareerJob(job))
    .map((job) => ({ path: `/careers/${job.slug}`, lastmod: isoDate(job.datePosted) }));
  const totalCataloguePages = Math.ceil(programmeEntries.length / CATALOGUE_DIRECTORY_PAGE_SIZE);
  const cataloguePaginationEntries = Array.from(
    { length: Math.max(0, totalCataloguePages - 1) },
    (_, index) => ({ path: catalogueDirectoryPath(index + 2) }),
  );
  const childSitemaps = [
    ['sitemap-pages.xml', [
      { path: '/' },
      { path: '/catalogue' },
      ...cataloguePaginationEntries,
      { path: '/e-learning/' },
      { path: '/training-roi' },
      ...landingEntries,
    ]],
    ['sitemap-programmes.xml', programmeEntries],
    ['sitemap-insights.xml', [
      { path: '/insights' },
      ...[...insightEntries.values()].sort((left, right) => left.path.localeCompare(right.path)),
    ]],
    ['sitemap-careers.xml', [{ path: '/careers' }, ...careerEntries]],
  ] satisfies Array<[string, SitemapEntry[]]>;

  await mkdir(outputDirectory, { recursive: true });

  await Promise.all([
    ...childSitemaps.map(([filename, entries]) => (
      writeFile(path.join(outputDirectory, filename), renderUrlSet(entries), 'utf8')
    )),
    writeFile(
      path.join(outputDirectory, 'sitemap.xml'),
      renderSitemapIndex(childSitemaps.map(([filename]) => filename)),
      'utf8',
    ),
    writeFile(
      path.join(outputDirectory, 'robots.txt'),
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /api/admin/',
        'Disallow: /api/',
        'Disallow: /preview/',
        '',
        'User-agent: OAI-SearchBot',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /api/',
        'Disallow: /preview/',
        '',
        'User-agent: GPTBot',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /api/',
        'Disallow: /preview/',
        '',
        `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
        '',
      ].join('\n'),
      'utf8',
    ),
    writeFile(
      path.join(outputDirectory, 'insights.xml'),
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
        '  <channel>',
        '    <title>TechnoEdge Insights</title>',
        `    <link>${SITE_ORIGIN}/insights</link>`,
        `    <atom:link href="${SITE_ORIGIN}/insights.xml" rel="self" type="application/rss+xml" />`,
        '    <description>Enterprise learning, technology, data and AI insights from TechnoEdge.</description>',
        '    <language>en</language>',
        ...indexableInsights
          .sort((left, right) => String(right.datePublished ?? right.dateModified ?? '').localeCompare(String(left.datePublished ?? left.dateModified ?? '')))
          .map(renderRssItem),
        '  </channel>',
        '</rss>',
        '',
      ].join('\n'),
      'utf8',
    ),
  ]);

  console.log(`SEO files generated for ${programmeEntries.length} published programme URLs, ${insightEntries.size} indexable insight URLs and ${careerEntries.length} indexable job URLs.`);
}

await main();
