import crypto from 'node:crypto';
import express from 'express';
import ExcelJS from 'exceljs';
import sharp from 'sharp';
import {
  changeOwnerPassword,
  configuredOwnerEmail,
  createAdminSession,
  createRequireAdmin,
  recentFailedAttempts,
  recordLoginAttempt,
  requestPasswordRecovery,
  requireCsrf,
  revokeAdminSession,
  revokeAllOwnerSessions,
  updatePasswordWithRecoveryToken,
  validateStrongPassword,
  verifyOwnerPassword,
  writeAudit,
} from './adminAuth.mjs';
import {
  addEnquiryNote,
  getAdminDashboard,
  getAdminSettings,
  getEnquiry,
  listAuditLog,
  listEnquiries,
  updateAdminProfile,
  updateEnquiry,
} from './adminRepository.mjs';
import {
  createAdminBlog,
  duplicateAdminBlog,
  getAdminBlog,
  listAdminBlogs,
  listAdminComments,
  moderateComments,
  restoreBlogRevision,
  updateAdminBlog,
} from './blogRepository.mjs';
import { createImportCentreRouter } from './importCentre.mjs';

function safeError(response, error, fallback = 'The request could not be completed.') {
  const known = /^(Invalid|Enter|Choose|Use|A required|Article|Too many|The security|This account)/.test(error.message || '');
  return response.status(error.status || (known ? 400 : 500)).json({ error: known ? error.message : fallback });
}

function queryOptions(request) {
  return Object.fromEntries(Object.entries(request.query).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value?.toString()]));
}

function csvCell(value) {
  let text = value == null ? '' : Array.isArray(value) ? value.join(', ') : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

async function exportEnquiries(pool, options, format) {
  const first = await listEnquiries(pool, { ...options, page: 1, pageSize: 100 });
  const rows = [...first.data];
  const pages = Math.min(Math.ceil(first.pagination.total / 100), 100);
  for (let page = 2; page <= pages; page += 1) {
    const result = await listEnquiries(pool, { ...options, page, pageSize: 100 });
    rows.push(...result.data);
  }
  const columns = [
    ['reference', 'Reference'], ['received_at', 'Received at'], ['kind', 'Type'], ['name', 'Name'],
    ['email', 'Email'], ['phone', 'Phone'], ['company', 'Organisation'], ['service', 'Service'],
    ['course_id', 'Course ID'], ['course_title', 'Course title'], ['course_category', 'Course category'],
    ['learners', 'Expected learners'], ['delivery', 'Delivery'], ['notes', 'Requirements'],
    ['preferred_channel', 'Preferred channel'], ['trainer_expertise', 'Trainer expertise'],
    ['trainer_experience', 'Trainer experience'], ['profile_url', 'Profile URL'],
    ['source_page', 'Source page'], ['cta_id', 'CTA ID'], ['status', 'Status'],
    ['priority', 'Priority'], ['tags', 'Tags'], ['follow_up_at', 'Follow-up'], ['crm_status', 'CRM status'],
  ];
  if (format === 'csv') {
    return {
      contentType: 'text/csv; charset=utf-8',
      extension: 'csv',
      body: `\uFEFF${[columns.map(([, label]) => csvCell(label)).join(','), ...rows.map((row) => columns.map(([key]) => csvCell(row[key])).join(','))].join('\r\n')}`,
    };
  }
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TechnoEdge adminzz';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Enquiries', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = columns.map(([key, header]) => ({ key, header, width: Math.min(Math.max(header.length + 4, 16), 52) }));
  for (const row of rows) {
    sheet.addRow(Object.fromEntries(columns.map(([key]) => [key, Array.isArray(row[key]) ? row[key].join(', ') : row[key] ?? ''])));
  }
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF01266A' } };
  sheet.autoFilter = { from: 'A1', to: `${sheet.getColumn(columns.length).letter}1` };
  return {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: 'xlsx',
    body: await workbook.xlsx.writeBuffer(),
  };
}

async function uploadBlogImage(pool, request) {
  if (!Buffer.isBuffer(request.body) || request.body.length === 0) throw new Error('Choose an image to upload.');
  if (request.body.length > 5 * 1024 * 1024) throw new Error('Choose an image smaller than 5 MB.');
  const sourceType = String(request.headers['content-type'] || '').split(';')[0];
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(sourceType)) throw new Error('Use a JPEG, PNG, or WebP image.');
  const metadata = await sharp(request.body).metadata();
  if (!metadata.width || !metadata.height || metadata.width < 320 || metadata.height < 180) {
    throw new Error('Use an image at least 320 × 180 pixels.');
  }
  const transformed = await sharp(request.body)
    .rotate()
    .resize({ width: 2000, height: 1400, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer();
  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  const bucket = String(process.env.SUPABASE_STORAGE_BUCKET || 'technoedge-media');
  if (!supabaseUrl || !serviceKey) throw new Error('Media storage is not configured.');
  const now = new Date();
  const storagePath = `blogs/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}.webp`;
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${storagePath}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      'Content-Type': 'image/webp',
      'x-upsert': 'false',
    },
    body: transformed,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || 'The image could not be stored.');
  }
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
  await pool.query(`
    INSERT INTO content.media (
      storage_path, public_url, original_name, mime_type, byte_size, uploaded_by
    ) VALUES ($1, $2, $3, 'image/webp', $4, $5::uuid)
  `, [storagePath, publicUrl, String(request.headers['x-file-name'] || 'blog-image').slice(0, 255), transformed.length, request.admin.authUserId]);
  return { publicUrl, width: metadata.width, height: metadata.height };
}

export function createAdminRouter(pool) {
  const router = express.Router();
  const requireAdmin = createRequireAdmin(pool);

  router.post('/auth/login', async (request, response) => {
    const email = String(request.body?.email || '').trim().toLowerCase();
    const password = String(request.body?.password || '');
    const ownerEmail = configuredOwnerEmail();
    try {
      if (!ownerEmail) throw new Error('Admin login is not configured.');
      if ((await recentFailedAttempts(pool, email, request)) >= 5) {
        return response.status(429).json({ error: 'Too many sign-in attempts. Wait 30 minutes and try again.' });
      }
      if (!email || email !== ownerEmail || !password) throw new Error('Invalid sign-in.');
      const user = await verifyOwnerPassword(email, password);
      if (!user?.id || String(user.email || '').toLowerCase() !== ownerEmail) throw new Error('Invalid sign-in.');
      await recordLoginAttempt(pool, email, request, true);
      const session = await createAdminSession(pool, request, response, user);
      const profile = await pool.query('SELECT * FROM admin.profiles WHERE auth_user_id = $1::uuid', [user.id]);
      await writeAudit(pool, request, {
        action: 'auth.login_succeeded', entityType: 'admin_session', entityId: user.id,
        actor: { authUserId: user.id, email },
      });
      return response.json({ authenticated: true, csrfToken: session.csrfToken, expiresAt: session.expiresAt, profile: profile.rows[0] });
    } catch (error) {
      await recordLoginAttempt(pool, email || 'unknown', request, false).catch(() => {});
      await writeAudit(pool, request, {
        action: 'auth.login_failed', entityType: 'admin_session', metadata: { reason: 'invalid_credentials' },
        actor: { authUserId: null, email: email === ownerEmail ? email : '' },
      }).catch(() => {});
      if (error.message === 'Admin login is not configured.') return response.status(503).json({ error: error.message });
      return response.status(401).json({ error: 'The email or password is incorrect.' });
    }
  });

  router.post('/auth/forgot-password', async (request, response) => {
    const email = String(request.body?.email || '').trim().toLowerCase();
    const ownerEmail = configuredOwnerEmail();
    if (email && ownerEmail && email === ownerEmail) {
      const origin = String(process.env.ADMIN_ORIGIN || `${request.protocol}://${request.get('host')}`).replace(/\/$/, '');
      await requestPasswordRecovery(email, `${origin}/adminzz/reset-password`).catch(() => {});
    }
    return response.json({ message: 'If the owner account exists, a recovery email has been sent.' });
  });

  router.post('/auth/reset-password', async (request, response) => {
    try {
      const accessToken = String(request.body?.accessToken || '');
      const password = String(request.body?.password || '');
      const passwordError = validateStrongPassword(password);
      if (passwordError) return response.status(400).json({ error: passwordError });
      const user = await updatePasswordWithRecoveryToken(accessToken, password);
      if (!user?.id || String(user.email || '').toLowerCase() !== configuredOwnerEmail()) throw new Error('Invalid recovery session.');
      await revokeAllOwnerSessions(pool, user.id);
      await writeAudit(pool, request, {
        action: 'auth.password_reset', entityType: 'admin_profile', entityId: user.id,
        actor: { authUserId: user.id, email: user.email },
      });
      return response.json({ message: 'Password updated. Sign in with the new password.' });
    } catch (error) {
      return response.status(400).json({ error: 'The recovery link is invalid or expired.' });
    }
  });

  router.get('/session', requireAdmin, (request, response) => response.json({
    authenticated: true,
    csrfToken: request.admin.csrfToken,
    profile: {
      email: request.admin.email,
      displayName: request.admin.displayName,
      defaultAuthor: request.admin.defaultAuthor,
    },
    createdAt: request.admin.createdAt,
    expiresAt: request.admin.expiresAt,
  }));

  router.use(requireAdmin);
  router.use(requireCsrf);

  router.post('/auth/logout', async (request, response, next) => {
    try {
      await writeAudit(pool, request, { action: 'auth.logout', entityType: 'admin_session', entityId: request.admin.sessionId });
      await revokeAdminSession(pool, request, response);
      return response.json({ authenticated: false });
    } catch (error) { return next(error); }
  });

  router.get('/dashboard', async (_request, response, next) => {
    try { return response.json(await getAdminDashboard(pool)); } catch (error) { return next(error); }
  });

  router.get('/enquiries', async (request, response, next) => {
    try { return response.json(await listEnquiries(pool, queryOptions(request))); } catch (error) { return next(error); }
  });
  router.get('/enquiries/export', async (request, response, next) => {
    try {
      const format = request.query.format === 'csv' ? 'csv' : 'xlsx';
      const exported = await exportEnquiries(pool, queryOptions(request), format);
      await writeAudit(pool, request, { action: 'enquiries.exported', entityType: 'enquiry_export', metadata: { format, filters: queryOptions(request) } });
      response.setHeader('Content-Type', exported.contentType);
      response.setHeader('Content-Disposition', `attachment; filename="technoedge-enquiries-${new Date().toISOString().slice(0, 10)}.${exported.extension}"`);
      return response.send(exported.body);
    } catch (error) { return next(error); }
  });
  router.get('/enquiries/:submissionId', async (request, response, next) => {
    try {
      const enquiry = await getEnquiry(pool, request.params.submissionId);
      if (!enquiry) return response.status(404).json({ error: 'Enquiry not found.' });
      return response.json(enquiry);
    } catch (error) { return next(error); }
  });
  router.patch('/enquiries/:submissionId', async (request, response) => {
    try {
      const enquiry = await updateEnquiry(pool, request.admin, request.params.submissionId, request.body || {});
      if (!enquiry) return response.status(404).json({ error: 'Enquiry not found.' });
      await writeAudit(pool, request, { action: 'enquiry.updated', entityType: 'enquiry', entityId: request.params.submissionId, metadata: request.body });
      return response.json(enquiry);
    } catch (error) { return safeError(response, error); }
  });
  router.post('/enquiries/:submissionId/notes', async (request, response) => {
    try {
      const note = await addEnquiryNote(pool, request.admin, request.params.submissionId, request.body?.note);
      await writeAudit(pool, request, { action: 'enquiry.note_added', entityType: 'enquiry', entityId: request.params.submissionId });
      return response.status(201).json(note);
    } catch (error) { return safeError(response, error); }
  });

  router.get('/blogs', async (request, response) => {
    try { return response.json(await listAdminBlogs(pool, queryOptions(request))); } catch (error) { return safeError(response, error); }
  });
  router.post('/blogs', async (request, response) => {
    try {
      const post = await createAdminBlog(pool, request.admin, request.body || {});
      await writeAudit(pool, request, { action: 'blog.created', entityType: 'blog_post', entityId: post.post_id, metadata: { slug: post.slug } });
      return response.status(201).json(post);
    } catch (error) { return safeError(response, error); }
  });
  router.get('/blogs/:postId', async (request, response, next) => {
    try {
      const post = await getAdminBlog(pool, request.params.postId);
      if (!post) return response.status(404).json({ error: 'Article not found.' });
      return response.json(post);
    } catch (error) { return next(error); }
  });
  router.put('/blogs/:postId', async (request, response) => {
    try {
      const post = await updateAdminBlog(pool, request.admin, request.params.postId, request.body || {});
      if (!post) return response.status(404).json({ error: 'Article not found.' });
      await writeAudit(pool, request, { action: `blog.${post.status}`, entityType: 'blog_post', entityId: post.post_id, metadata: { slug: post.slug, revision: post.revision } });
      return response.json(post);
    } catch (error) { return safeError(response, error); }
  });
  router.post('/blogs/:postId/duplicate', async (request, response) => {
    try {
      const post = await duplicateAdminBlog(pool, request.admin, request.params.postId);
      if (!post) return response.status(404).json({ error: 'Article not found.' });
      await writeAudit(pool, request, { action: 'blog.duplicated', entityType: 'blog_post', entityId: post.post_id, metadata: { source: request.params.postId } });
      return response.status(201).json(post);
    } catch (error) { return safeError(response, error); }
  });
  router.post('/blogs/:postId/revisions/:revision/restore', async (request, response) => {
    try {
      const post = await restoreBlogRevision(pool, request.admin, request.params.postId, Number(request.params.revision));
      if (!post) return response.status(404).json({ error: 'Revision not found.' });
      await writeAudit(pool, request, { action: 'blog.revision_restored', entityType: 'blog_post', entityId: post.post_id, metadata: { revision: Number(request.params.revision) } });
      return response.json(post);
    } catch (error) { return safeError(response, error); }
  });
  router.post('/media', express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }), async (request, response) => {
    try {
      const media = await uploadBlogImage(pool, request);
      await writeAudit(pool, request, { action: 'media.uploaded', entityType: 'media', metadata: { publicUrl: media.publicUrl } });
      return response.status(201).json(media);
    } catch (error) { return safeError(response, error); }
  });

  router.get('/comments', async (request, response) => {
    try { return response.json(await listAdminComments(pool, queryOptions(request))); } catch (error) { return safeError(response, error); }
  });
  router.patch('/comments', async (request, response) => {
    try {
      const ids = await moderateComments(pool, request.admin, request.body?.commentIds, request.body?.status);
      await writeAudit(pool, request, { action: `comments.${request.body?.status}`, entityType: 'blog_comment', metadata: { count: ids.length, commentIds: ids } });
      return response.json({ updated: ids.length });
    } catch (error) { return safeError(response, error); }
  });

  router.get('/settings', async (request, response, next) => {
    try { return response.json(await getAdminSettings(pool, request.admin.authUserId)); } catch (error) { return next(error); }
  });
  router.patch('/settings', async (request, response) => {
    try {
      const result = await updateAdminProfile(pool, request.admin, request.body || {});
      await writeAudit(pool, request, { action: 'settings.updated', entityType: 'admin_profile', entityId: request.admin.authUserId });
      return response.json(result);
    } catch (error) { return safeError(response, error); }
  });
  router.post('/settings/password', async (request, response) => {
    try {
      const nextPassword = String(request.body?.nextPassword || '');
      const passwordError = validateStrongPassword(nextPassword);
      if (passwordError) return response.status(400).json({ error: passwordError });
      await changeOwnerPassword(request.admin.email, String(request.body?.currentPassword || ''), nextPassword);
      await writeAudit(pool, request, { action: 'auth.password_changed', entityType: 'admin_profile', entityId: request.admin.authUserId });
      await revokeAllOwnerSessions(pool, request.admin.authUserId);
      response.clearCookie('te_admin_session', { path: '/' });
      response.clearCookie('te_admin_csrf', { path: '/' });
      return response.json({ message: 'Password updated. Sign in again.' });
    } catch (_error) { return response.status(400).json({ error: 'The current password is incorrect or the new password was rejected.' }); }
  });
  router.get('/audit', async (request, response, next) => {
    try { return response.json(await listAuditLog(pool, queryOptions(request))); } catch (error) { return next(error); }
  });

  router.use('/catalogue/import', createImportCentreRouter(pool, { authenticated: true }));

  return router;
}
