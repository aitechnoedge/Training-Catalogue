import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCatalogueFilters, getCourseById, listCourses } from './catalogueRepository.mjs';
import { EnquiryInputError, EnquiryStorageUnavailableError, saveContactActionToWorkbook, saveEnquiryToWorkbook, validateEnquiry } from './enquiries.mjs';
import { saveEnquiryToDatabase } from './enquiryDatabase.mjs';
import { saveContactActionToDatabase, validateContactAction } from './contactActions.mjs';
import { createAdminRouter } from './adminRouter.mjs';
import { getPublicBlog, listApprovedComments, listPublicBlogs, publishDueBlogs, submitPublicComment } from './blogRepository.mjs';
import { sendEnquiryNotification } from './adminNotifications.mjs';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const distDirectory = path.resolve(serverDirectory, '../dist');

function positiveInteger(value, fallback) {
  if (value == null || value === '') return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error('Pagination and duration values must be positive integers.');
  return parsed;
}

function stringValues(value) {
  if (value == null) return [];
  return (Array.isArray(value) ? value : [value])
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);
}

function positiveIntegerValues(value) {
  return stringValues(value).map((item) => positiveInteger(item, undefined));
}

function leadStorageMode() {
  return process.env.LEADS_STORAGE_MODE?.trim().toLowerCase()
    || (process.env.VERCEL || process.env.VERCEL_ENV ? 'postgres' : 'hybrid');
}

function storeEnquiry(pool, enquiry) {
  const mode = leadStorageMode();
  if (mode === 'postgres') return saveEnquiryToDatabase(pool, enquiry);
  if (mode === 'excel') return saveEnquiryToWorkbook(enquiry);
  if (mode === 'hybrid') {
    if (process.env.VERCEL || process.env.VERCEL_ENV) {
      throw new EnquiryStorageUnavailableError('Hybrid Excel storage is not available on Vercel. Use PostgreSQL lead storage.');
    }
    return saveEnquiryToDatabase(pool, enquiry).then(async (saved) => {
      await saveEnquiryToWorkbook(enquiry, { reference: saved.reference });
      return saved;
    });
  }
  throw new EnquiryStorageUnavailableError('Enquiry storage is not configured correctly.');
}

function storeContactAction(pool, action) {
  const mode = leadStorageMode();
  if (mode === 'postgres') return saveContactActionToDatabase(pool, action);
  if (mode === 'excel') return saveContactActionToWorkbook(action);
  if (mode === 'hybrid') {
    if (process.env.VERCEL || process.env.VERCEL_ENV) {
      throw new EnquiryStorageUnavailableError('Hybrid Excel storage is not available on Vercel. Use PostgreSQL lead storage.');
    }
    return saveContactActionToDatabase(pool, action).then(async (saved) => {
      await saveContactActionToWorkbook(action);
      return saved;
    });
  }
  throw new EnquiryStorageUnavailableError('Contact action storage is not configured correctly.');
}

export function createApp(pool, { serveStatic = process.env.NODE_ENV === 'production' || process.env.SERVE_STATIC === 'true', saveEnquiry = (enquiry) => storeEnquiry(pool, enquiry), saveContactAction = (action) => storeContactAction(pool, action) } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/adminzz', createAdminRouter(pool));

  app.get('/api/indexnow-key', (_request, response) => {
    const key = process.env.INDEXNOW_KEY?.trim();
    if (!key || !/^[a-zA-Z0-9-]{8,128}$/.test(key)) return response.sendStatus(404);
    return response.type('text/plain').send(key);
  });

  app.get('/api/cron/publish', async (request, response) => {
    const expected = String(process.env.CRON_SECRET || '');
    const provided = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!expected || provided !== expected) return response.sendStatus(401);
    try {
      const published = await publishDueBlogs(pool, 'scheduler');
      return response.json({ published: published.length, checkedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Scheduled publication check failed:', error);
      return response.status(500).json({ error: 'Scheduled publication check failed.' });
    }
  });

  app.post('/api/enquiries', async (request, response, next) => {
    try {
      const enquiry = validateEnquiry(request.body);
      const result = await saveEnquiry(enquiry);
      await sendEnquiryNotification(pool, enquiry, result.reference).catch((error) => {
        console.error('Enquiry notification could not be sent:', error.message);
      });
      response.status(result.duplicate ? 200 : 201).json({ reference: result.reference });
    } catch (error) {
      if (error instanceof EnquiryInputError) return response.status(400).json({ error: error.message });
      if (error instanceof EnquiryStorageUnavailableError) return response.status(503).json({ error: error.message });
      console.error('Enquiry could not be stored:', error);
      return response.status(500).json({ error: 'Your enquiry could not be saved. Please try again or contact us directly.' });
    }
  });

  app.post('/api/contact-actions', async (request, response) => {
    try {
      const action = validateContactAction(request.body);
      const result = await saveContactAction(action);
      return response.status(result.duplicate ? 200 : 201).json({ recorded: true });
    } catch (error) {
      if (error instanceof EnquiryInputError) return response.status(400).json({ error: error.message });
      if (error instanceof EnquiryStorageUnavailableError) return response.status(503).json({ error: error.message });
      console.error('Contact action could not be stored:', error);
      return response.status(500).json({ error: 'The contact action could not be recorded.' });
    }
  });

  app.get('/api/health', async (_request, response, next) => {
    try {
      const result = await pool.query(`
        SELECT current_database() AS database, now() AS server_time,
               to_regclass('catalogue.courses') IS NOT NULL AS schema_ready
      `);
      response.json({ status: 'ok', ...result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/courses', async (request, response, next) => {
    try {
      const result = await listCourses(pool, {
        category: request.query.category?.toString(),
        query: request.query.q?.toString().trim(),
        level: request.query.level?.toString(),
        tools: stringValues(request.query.tool),
        industries: stringValues(request.query.industry),
        departments: stringValues(request.query.department),
        subTypes: stringValues(request.query.subType),
        portfolios: stringValues(request.query.portfolio),
        providers: stringValues(request.query.provider),
        productTechnologies: stringValues(request.query.productTechnology),
        technologyCategories: stringValues(request.query.technologyCategory),
        durationMinutes: positiveIntegerValues(request.query.durationMinutes),
        sort: request.query.sort?.toString(),
        page: positiveInteger(request.query.page, 1),
        pageSize: positiveInteger(request.query.pageSize, 9),
      });
      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/catalogue/filters', async (request, response, next) => {
    try {
      const category = request.query.category?.toString() || 'tools-technology';
      response.json(await getCatalogueFilters(pool, category, {
        subType: request.query.subType?.toString(),
      }));
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/insights', async (request, response, next) => {
    try {
      const data = await listPublicBlogs(pool, { limit: request.query.limit });
      return response.json({ data });
    } catch (error) {
      return next(error);
    }
  });

  app.get('/api/insights/:slug', async (request, response, next) => {
    try {
      const result = await getPublicBlog(pool, request.params.slug);
      if (!result) return response.status(404).json({ error: 'Article not found.' });
      if (result.redirect) return response.status(308).json({ redirect: `/insights/${result.redirect}` });
      return response.json(result);
    } catch (error) {
      return next(error);
    }
  });

  app.get('/api/insights/:slug/comments', async (request, response, next) => {
    try {
      return response.json({ data: await listApprovedComments(pool, request.params.slug) });
    } catch (error) {
      return next(error);
    }
  });

  app.post('/api/insights/:slug/comments', async (request, response) => {
    try {
      const result = await submitPublicComment(pool, request, request.params.slug, request.body || {});
      return response.status(202).json({ ...result, message: 'Your comment was received and is awaiting moderation.' });
    } catch (error) {
      return response.status(error.status || 400).json({ error: error.message || 'The comment could not be submitted.' });
    }
  });

  app.get('/api/insights-sitemap', async (_request, response, next) => {
    try {
      const origin = String(process.env.APP_URL || 'https://www.technoedgels.com').replace(/\/$/, '');
      const articles = await listPublicBlogs(pool, { limit: 500 });
      const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
      const urls = articles
        .filter((article) => article.indexable)
        .map((article) => `  <url><loc>${escape(`${origin}${article.url}`)}</loc><lastmod>${escape(article.dateModified)}</lastmod></url>`)
        .join('\n');
      return response.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
    } catch (error) {
      return next(error);
    }
  });

  app.get('/api/courses/:courseId', async (request, response, next) => {
    try {
      const courseId = request.params.courseId.trim().toUpperCase();
      const isLegacyCertificationCode = /^[A-Z0-9]{2,12}-[A-Z0-9][A-Z0-9-]{1,30}$/.test(courseId) && /\d/.test(courseId);
      if (!(/^(RB|PP|PI|BS|TT|TC|CER)\d{4,}$/.test(courseId) || isLegacyCertificationCode)) {
        return response.status(400).json({ error: 'Invalid course ID.' });
      }
      const course = await getCourseById(pool, courseId);
      if (!course) return response.status(404).json({ error: 'Course not found.' });
      return response.json({ data: course });
    } catch (error) {
      return next(error);
    }
  });

  if (serveStatic) {
    if (!fs.existsSync(distDirectory)) {
      throw new Error(`Static build directory not found: ${distDirectory}. Run npm run build first.`);
    }
    app.get('/', (_request, response) => response.sendFile(path.join(distDirectory, 'website', 'index.html')));
    app.get(/^\/website\/?$/, (_request, response) => response.redirect(308, '/'));
    app.get(/^\/website\/index\.html$/, (_request, response) => response.redirect(308, '/'));
    app.get(/.*/, (request, response, next) => {
      const relativePath = request.path.replace(/^\/+|\/+$/g, '');
      if (!relativePath || path.extname(relativePath)) return next();
      const cleanHtml = path.resolve(distDirectory, `${relativePath}.html`);
      if (!cleanHtml.startsWith(`${distDirectory}${path.sep}`) || !fs.existsSync(cleanHtml)) return next();
      return response.sendFile(cleanHtml);
    });
    app.use(express.static(distDirectory, { extensions: ['html'] }));
    app.use((request, response, next) => {
      if (request.method !== 'GET' || request.path.startsWith('/api/') || !request.accepts('html')) {
        return next();
      }
      return response.status(404).sendFile(path.join(distDirectory, '404.html'));
    });
  }

  app.use((error, _request, response, _next) => {
    const isInputError = error.message?.startsWith('Invalid') || error.message?.includes('positive integers');
    if (!isInputError) console.error(error);
    response.status(isInputError ? 400 : 500).json({
      error: isInputError ? error.message : 'The website service could not complete the request.',
    });
  });

  return app;
}
