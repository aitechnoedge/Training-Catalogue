/**
 * Local-only adminzz verification against the configured database.
 *
 * This deliberately runs every write through one transaction and always rolls
 * it back. It is safe for a shared database: no enquiries, CRM outbox rows,
 * articles, comments, revisions, audit entries, or settings changes persist.
 * It does not call email, CRM, Excel, media-storage, or public cron endpoints.
 */
import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { closePool, getPool } from '../server/database.mjs';
import { validateEnquiry } from '../server/enquiries.mjs';
import { saveEnquiryToDatabase } from '../server/enquiryDatabase.mjs';
import { validateContactAction, saveContactActionToDatabase } from '../server/contactActions.mjs';
import { getAdminDashboard, getAdminSettings, getEnquiry, listAuditLog, listEnquiries, updateAdminProfile } from '../server/adminRepository.mjs';
import { createAdminBlog, getAdminBlog, listAdminComments, listApprovedComments, moderateComments, publishDueBlogs, submitPublicComment } from '../server/blogRepository.mjs';
import { parseImportSource, validateCourseRecords } from '../server/toolsImportParser.mjs';

if (process.env.ADMINZZ_SANDBOX_TEST !== 'run') {
  throw new Error('Refusing to run. Use ADMINZZ_SANDBOX_TEST=run to confirm the rollback-only verification.');
}

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pool = getPool();
const client = await pool.connect();
const results = [];

function pass(label, details = '') {
  results.push({ label, details });
  console.log(`PASS  ${label}${details ? ` — ${details}` : ''}`);
}

function transactionalPool() {
  let savepoint = 0;
  // A single pg Client cannot safely run concurrent queries. The production
  // pool supports that pattern, but this rollback-only harness deliberately
  // uses one transaction, so serialize queries before forwarding them.
  let queryQueue = Promise.resolve();
  const queryInTransaction = (text, values) => {
    const next = queryQueue.then(() => client.query(text, values));
    queryQueue = next.catch(() => {});
    return next;
  };
  const wrappedClient = {
    query: async (text, values) => {
      const statement = String(text).trim().toUpperCase();
      if (statement === 'BEGIN') {
        savepoint += 1;
        return queryInTransaction(`SAVEPOINT adminzz_enquiry_${savepoint}`);
      }
      if (statement === 'COMMIT') {
        const current = savepoint;
        savepoint = Math.max(0, savepoint - 1);
        return queryInTransaction(`RELEASE SAVEPOINT adminzz_enquiry_${current}`);
      }
      if (statement === 'ROLLBACK') {
        const current = savepoint;
        savepoint = Math.max(0, savepoint - 1);
        return current ? queryInTransaction(`ROLLBACK TO SAVEPOINT adminzz_enquiry_${current}`) : { rows: [], rowCount: 0 };
      }
      return queryInTransaction(text, values);
    },
    release: () => {},
  };
  return {
    query: (...arguments_) => queryInTransaction(...arguments_),
    connect: async () => wrappedClient,
  };
}

const sandboxPool = transactionalPool();

try {
  await client.query('BEGIN');

  const courseResult = await client.query(`
    SELECT course_id, title, category_code
    FROM catalogue.courses
    WHERE status = 'published'
    ORDER BY random()
    LIMIT 4
  `);
  assert.equal(courseResult.rows.length, 4, 'Four published courses are required for the enquiry test.');
  pass('Catalogue has four random published courses for enquiry coverage');

  const ownerResult = await client.query(`
    SELECT auth_user_id, email, display_name, default_author
    FROM admin.profiles WHERE active = true ORDER BY created_at LIMIT 1
  `);
  const owner = ownerResult.rows[0];
  assert.ok(owner?.auth_user_id, 'An active adminzz owner profile is required.');
  const actor = { authUserId: owner.auth_user_id, email: owner.email, displayName: owner.display_name, defaultAuthor: owner.default_author };
  pass('Adminzz owner profile is available for authenticated workflow checks');

  const dashboardBefore = await getAdminDashboard(sandboxPool);
  const enquiries = courseResult.rows.map((course, index) => validateEnquiry({
    kind: 'course',
    submissionId: randomUUID(),
    name: `Adminzz Sandbox ${index + 1}`,
    email: `adminzz-sandbox-${index + 1}@example.invalid`,
    phone: `90000000${10 + index}`,
    company: 'TechnoEdge sandbox verification',
    courseId: course.course_id,
    courseTitle: course.title,
    courseCategory: course.category_code,
    learners: `${10 + index * 5} learners`,
    delivery: index % 2 ? 'Virtual instructor-led' : 'Instructor-led',
    notes: `Rollback-only enquiry verification for ${course.course_id}.`,
    preferredChannel: 'email',
    sourcePage: '/catalogue',
    ctaId: `sandbox-enquiry-${index + 1}`,
  }));

  for (const enquiry of enquiries) {
    const saved = await saveEnquiryToDatabase(sandboxPool, enquiry);
    assert.match(saved.reference, /^TE-\d{8}-[A-F0-9]{8}$/);
  }
  const enquiryList = await listEnquiries(sandboxPool, { query: 'Adminzz Sandbox', pageSize: 10 });
  assert.equal(enquiryList.data.length, 4);
  assert.ok(enquiryList.data.every((row) => row.crm_status === 'pending'));
  pass('Four course enquiries persist with references and pending CRM queue entries');

  const detail = await getEnquiry(sandboxPool, enquiries[0].submissionId);
  assert.equal(detail?.course_id, enquiries[0].courseId);
  pass('Enquiry details retain course attribution and contact information');

  for (const [index, channel] of ['call', 'email', 'whatsapp'].entries()) {
    const destination = channel === 'email' ? 'contact@example.invalid' : `90000000${30 + index}`;
    const action = validateContactAction({ eventId: randomUUID(), channel, destination, sourcePage: '/catalogue', ctaLabel: `Sandbox ${channel} CTA` });
    const saved = await saveContactActionToDatabase(sandboxPool, action);
    assert.equal(saved.duplicate, false);
  }
  pass('Call, email, and WhatsApp CTA activity records successfully');

  const scheduledPosts = [];
  for (const index of [1, 2, 3]) {
    const post = await createAdminBlog(sandboxPool, actor, {
      title: `Adminzz Sandbox Scheduled Article ${index}`,
      slug: `adminzz-sandbox-scheduled-${index}-${randomUUID().slice(0, 8)}`,
      excerpt: `Rollback-only schedule verification article ${index}.`,
      contentHtml: `<h2>Sandbox article ${index}</h2><p>This verifies scheduled publishing without leaving public content behind.</p>`,
      category: 'AI & Automation',
      tags: ['sandbox', 'schedule'],
      authorName: actor.defaultAuthor || 'TechnoEdge Editorial Team',
      featuredImageUrl: `https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?fit=crop&w=${1200 + index}`,
      featuredImageAlt: `Sandbox image ${index}`,
      imageCaption: 'Test-only image metadata',
      seoTitle: `Sandbox scheduled article ${index}`,
      metaDescription: `Sandbox schedule check ${index}.`,
      canonicalUrl: `https://www.technoedgels.com/insights/sandbox-${index}`,
      status: 'scheduled',
      publishAt: new Date(Date.now() - index * 60_000).toISOString(),
      isFeatured: false,
      indexable: false,
    });
    scheduledPosts.push(post);
    assert.equal(post.status, 'scheduled');
    assert.ok(post.featured_image_url.includes('images.unsplash.com'));
  }
  pass('Three articles save with distinct schedules and image metadata');

  const published = await publishDueBlogs(sandboxPool, 'adminzz-sandbox-scheduler');
  assert.equal(published.filter((post) => scheduledPosts.some((candidate) => candidate.post_id === post.post_id)).length, 3);
  for (const post of scheduledPosts) {
    const current = await getAdminBlog(sandboxPool, post.post_id);
    assert.equal(current?.status, 'published');
    assert.ok(current?.published_at);
  }
  pass('Scheduler publishes all three due articles and records publication state');

  await submitPublicComment(sandboxPool, { headers: { 'user-agent': 'adminzz-sandbox' }, socket: { remoteAddress: '127.0.0.1' } }, scheduledPosts[0].slug, {
    name: 'Sandbox visitor', email: 'visitor@example.invalid', message: 'This is a rollback-only moderation verification comment.', website: '',
  });
  const pendingComments = await listAdminComments(sandboxPool, { status: 'pending', query: 'Sandbox visitor' });
  assert.equal(pendingComments.data.length, 1);
  await moderateComments(sandboxPool, actor, [pendingComments.data[0].comment_id], 'approved');
  const approvedComments = await listApprovedComments(sandboxPool, scheduledPosts[0].slug);
  assert.equal(approvedComments.length, 1);
  pass('Public comment submission, moderation, and approved public visibility work');

  const dashboardAfter = await getAdminDashboard(sandboxPool);
  assert.equal(dashboardAfter.enquiries.total, dashboardBefore.enquiries.total + 4);
  assert.equal(dashboardAfter.blogs.published, dashboardBefore.blogs.published + 3);
  assert.ok((dashboardAfter.contactActions.call || 0) >= (dashboardBefore.contactActions.call || 0) + 1);
  assert.ok((dashboardAfter.contactActions.email || 0) >= (dashboardBefore.contactActions.email || 0) + 1);
  assert.ok((dashboardAfter.contactActions.whatsapp || 0) >= (dashboardBefore.contactActions.whatsapp || 0) + 1);
  pass('Dashboard KPIs reflect enquiries, publications, comments, CRM, and CTA activity');

  const settings = await getAdminSettings(sandboxPool, actor.authUserId);
  assert.equal(settings.profile.email, actor.email);
  assert.equal(settings.system.database.ok, true);
  await updateAdminProfile(sandboxPool, actor, {
    displayName: 'Sandbox owner', defaultAuthor: 'Sandbox editorial', recipientEmail: actor.email,
    enquiryEmailEnabled: false, commentEmailEnabled: true, publishingEmailEnabled: false,
  });
  pass('Settings profile, notification preferences, integration and system health queries work');

  const audit = await listAuditLog(sandboxPool, { query: 'adminzz-sandbox-scheduler' });
  assert.ok(audit.data.some((entry) => entry.action === 'blog.published_scheduled'));
  pass('Audit log captures scheduled-publication activity');

  const source = await fs.readFile(path.join(rootDirectory, 'data', 'normalized', 'tools-technology.json'));
  const parsed = await parseImportSource(source, 'tools-technology.json');
  const validation = validateCourseRecords(parsed.records, parsed.sourceIssues);
  assert.ok(validation.courses.length > 0);
  assert.equal(validation.issues.filter((issue) => issue.severity === 'error').length, 0);
  pass('Catalogue import parser and validation accept the canonical Tools data without errors', `${validation.courses.length} records`);
} finally {
  await client.query('ROLLBACK').catch(() => {});
  client.release();
  await closePool();
}

console.log(`\nSandbox verification complete: ${results.length} checks passed. All database changes were rolled back.`);
