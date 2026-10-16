import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { closePool, getPool } from '../server/database.mjs';

const inputPaths = process.argv.slice(2).filter((argument) => argument !== '--commit');
const commit = process.argv.includes('--commit');

if (inputPaths.length === 0) {
  throw new Error('Provide one or more Behavioural course-content files. Add --commit to write changes.');
}

const SECTION_NAMES = new Set(['Programme Objectives', 'Who Should Attend', 'Prerequisites', 'Modules']);

function cleanText(value = '') {
  return String(value)
    .replace(/\r/g, '')
    // Some pasted colour bullets arrive as unpaired surrogate code units. They
    // must never be inserted into PostgreSQL JSON values.
    .replace(/[\uD800-\uDFFF]/g, '')
    .replace(/^\s*[-*]\s+/, '')
    .replace(/\*\*/g, '')
    .replace(/^\s*[\uFE0F\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalisedHeading(line) {
  return cleanText(line.replace(/^#{1,3}\s+/, ''));
}

function findField(lines, label) {
  const expression = new RegExp(`^(?:\\*\\*)?${escapeRegExp(label)}(?:\\*\\*)?\\s*:\\s*(.+)$`, 'i');
  const line = lines.find((candidate) => expression.test(candidate.trim()));
  return cleanText(line?.trim().match(expression)?.[1] || '');
}

function isModuleHeading(line) {
  return /^(?:#{1,3}\s+)?Module\s+\d+\s*:/i.test(line.trim());
}

function sectionLines(lines, sectionName) {
  const start = lines.findIndex((line) => normalisedHeading(line) === sectionName);
  if (start < 0) return [];

  const items = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (SECTION_NAMES.has(normalisedHeading(line)) || isModuleHeading(line)) break;
    if (line.trim()) items.push(line);
  }
  return items;
}

function listItems(lines) {
  return lines.map(cleanText).filter(Boolean);
}

function parseModules(lines, courseId) {
  const headings = lines
    .map((line, index) => ({ line, index, match: line.trim().match(/^(?:#{1,3}\s+)?Module\s+(\d+)\s*:\s*(.+)$/i) }))
    .filter(({ match }) => match);

  if (headings.length === 0) throw new Error(`${courseId} has no modules.`);

  return headings.map(({ index, match }, position) => {
    const end = position + 1 < headings.length ? headings[position + 1].index : lines.length;
    const concepts = [];
    const practicalActivities = [];

    for (const rawLine of lines.slice(index + 1, end)) {
      const item = cleanText(rawLine);
      if (!item) continue;
      if (/^\s*(?:-\s*)?🟢/u.test(rawLine)) practicalActivities.push(item);
      else concepts.push(item);
    }

    if (concepts.length === 0 || practicalActivities.length === 0) {
      throw new Error(`${courseId} module ${match[1]} must include concepts and practical activities.`);
    }

    return {
      code: String(Number(match[1])).padStart(2, '0'),
      title: cleanText(match[2]),
      concepts,
      practicalActivities,
    };
  });
}

function deriveSeoDescription(title, objective) {
  const value = cleanText([title, objective].filter(Boolean).join(' — '));
  if (value.length < 50) return null;
  return value.length > 170 ? `${value.slice(0, 167).trimEnd()}...` : value;
}

function parseCourse(raw, sourcePath) {
  const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/);
  const courseId = findField(lines, 'Course ID').toUpperCase();
  const category = findField(lines, 'Category');
  const programmeName = findField(lines, 'Programme Name');
  const fullTitle = findField(lines, 'Title');
  const covers = findField(lines, 'Covers / Combines');
  const delivery = findField(lines, 'Delivery') || 'Instructor-Led';
  const level = findField(lines, 'Level');
  const duration = findField(lines, 'Duration');
  const durationMatch = duration.match(/^(8|16)\s+Hours$/i);

  if (!/^BS\d{4,}$/.test(courseId)) throw new Error(`${path.basename(sourcePath)} must contain a BS course ID.`);
  if (!/behavio[u]?ral/i.test(category)) throw new Error(`${courseId} must be in the Behavioural category.`);
  if (!fullTitle && !programmeName) throw new Error(`${courseId} is missing a title.`);
  if (!covers || !level || !durationMatch) throw new Error(`${courseId} has incomplete metadata.`);

  const objectives = listItems(sectionLines(lines, 'Programme Objectives'));
  const audience = listItems(sectionLines(lines, 'Who Should Attend'));
  const prerequisites = listItems(sectionLines(lines, 'Prerequisites'));
  const modules = parseModules(lines, courseId);
  const durationMinutes = Number(durationMatch[1]) * 60;
  const expectedModuleCount = durationMinutes === 480 ? 8 : 12;

  if (objectives.length === 0 || audience.length === 0 || prerequisites.length === 0) {
    throw new Error(`${courseId} is missing objectives, audience, or prerequisites.`);
  }
  if (modules.length !== expectedModuleCount) {
    throw new Error(`${courseId} is ${duration}, so it must contain ${expectedModuleCount} modules; found ${modules.length}.`);
  }

  const title = programmeName || fullTitle.split(':')[0].trim();
  return {
    courseId,
    title,
    fullTitle: fullTitle || title,
    delivery,
    level,
    durationMinutes,
    format: durationMinutes === 480 ? 'Workshop' : 'Capability Training',
    summary: objectives[0],
    objective: objectives.join('\n'),
    objectives,
    audience,
    prerequisites,
    relatedSkills: covers.split(';').map(cleanText).filter(Boolean),
    modules,
    seoDescription: deriveSeoDescription(fullTitle || title, objectives[0]),
    sourcePath,
    raw,
  };
}

async function insertOrderedValues(client, table, column, courseId, values) {
  if (values.length === 0) return;
  await client.query(
    `INSERT INTO ${table} (course_id, ${column}, display_order)
     SELECT $1, value, display_order
     FROM jsonb_to_recordset($2::jsonb) AS source(value text, display_order integer)`,
    [courseId, JSON.stringify(values.map((value, index) => ({ value, display_order: index + 1 })))],
  );
}

async function replaceCourse(client, course) {
  const existing = await client.query(
    `SELECT course_id
     FROM catalogue.courses
     WHERE course_id = $1 AND category_code = 'people-behavioural'
     FOR UPDATE`,
    [course.courseId],
  );
  if (existing.rowCount !== 1) {
    throw new Error(`${course.courseId} is not an existing People & Behavioural programme.`);
  }

  await client.query(
    `UPDATE catalogue.courses
     SET title = $2,
         level_code = $3,
         duration_minutes = $4,
         format = $5,
         delivery = $6,
         summary = $7,
         objective = $8,
         seo_description = $9,
         source_reference = $10
     WHERE course_id = $1`,
    [
      course.courseId,
      course.title,
      course.level,
      course.durationMinutes,
      course.format,
      course.delivery,
      course.summary,
      course.objective,
      course.seoDescription,
      path.basename(course.sourcePath),
    ],
  );

  for (const table of [
    'catalogue.course_objectives',
    'catalogue.course_audiences',
    'catalogue.course_prerequisites',
    'catalogue.course_related_skills',
    // Learning outcomes are removed by the module foreign-key cascade.
    'catalogue.course_modules',
  ]) {
    await client.query(`DELETE FROM ${table} WHERE course_id = $1`, [course.courseId]);
  }

  await insertOrderedValues(client, 'catalogue.course_objectives', 'objective', course.courseId, course.objectives);
  await insertOrderedValues(client, 'catalogue.course_audiences', 'audience', course.courseId, course.audience);
  await insertOrderedValues(client, 'catalogue.course_prerequisites', 'prerequisite', course.courseId, course.prerequisites);
  await insertOrderedValues(client, 'catalogue.course_related_skills', 'skill', course.courseId, course.relatedSkills);

  const modulesResult = await client.query(
    `INSERT INTO catalogue.course_modules (course_id, module_code, title, display_order)
     SELECT $1, module_code, title, display_order
     FROM jsonb_to_recordset($2::jsonb) AS source(module_code text, title text, display_order integer)
     RETURNING id, module_code`,
    [course.courseId, JSON.stringify(course.modules.map((module, index) => ({
      module_code: module.code,
      title: module.title,
      display_order: index + 1,
    })))],
  );
  const moduleIds = new Map(modulesResult.rows.map((module) => [module.module_code, module.id]));
  const outcomes = course.modules.flatMap((module) => [
    ...module.concepts.map((outcome, index) => ({
      module_id: moduleIds.get(module.code), outcome_type: 'concept', outcome, display_order: index + 1,
    })),
    ...module.practicalActivities.map((outcome, index) => ({
      module_id: moduleIds.get(module.code), outcome_type: 'practical_activity', outcome, display_order: index + 1,
    })),
  ]);
  await client.query(
    `INSERT INTO catalogue.module_learning_outcomes (module_id, outcome_type, outcome, display_order)
     SELECT module_id, outcome_type::catalogue.learning_item_type, outcome, display_order
     FROM jsonb_to_recordset($1::jsonb) AS source(module_id bigint, outcome_type text, outcome text, display_order integer)`,
    [JSON.stringify(outcomes)],
  );
}

async function replaceCourses(courses) {
  const pool = getPool();
  const client = await pool.connect();
  const fileNames = courses.map((course) => path.basename(course.sourcePath));
  const checksum = crypto.createHash('sha256').update(courses.map((course) => course.raw).join('\n')).digest('hex');

  try {
    await client.query('BEGIN');
    const batch = await client.query(
      `INSERT INTO catalogue.import_batches
        (original_file_name, source_checksum_sha256, uploaded_by, mode, status, total_rows, valid_rows, metadata)
       VALUES ($1, $2, 'behavioural-content-replacement', 'upsert', 'importing', $3, $3, $4::jsonb)
       RETURNING id`,
      [fileNames.join(', '), checksum, courses.length, JSON.stringify({ track: 'people-behavioural', operation: 'course-content-replacement' })],
    );
    const batchId = batch.rows[0].id;

    for (const course of courses) await replaceCourse(client, course);

    await client.query(
      `INSERT INTO catalogue.import_rows (batch_id, sheet_name, row_number, course_id, status, payload)
       SELECT $1, 'Behavioural Content Replacement', row_number, course_id, 'imported', payload
       FROM jsonb_to_recordset($2::jsonb) AS source(row_number integer, course_id text, payload jsonb)`,
      [batchId, JSON.stringify(courses.map((course, index) => ({
        row_number: index + 1,
        course_id: course.courseId,
        payload: { title: course.title, durationMinutes: course.durationMinutes, moduleCount: course.modules.length },
      })))],
    );
    await client.query(
      `UPDATE catalogue.import_batches
       SET status = 'completed', imported_rows = $2, completed_at = now()
       WHERE id = $1`,
      [batchId, courses.length],
    );
    await client.query('COMMIT');
    return { batchId, replaced: courses.map((course) => course.courseId) };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await closePool();
  }
}

const courses = await Promise.all(inputPaths.map(async (inputPath) => parseCourse(await fs.readFile(inputPath, 'utf8'), inputPath)));
const uniqueIds = new Set(courses.map((course) => course.courseId));
if (uniqueIds.size !== courses.length) throw new Error('Each replacement course must have a distinct BS ID.');

const summary = {
  courses: courses.map((course) => ({
    id: course.courseId,
    title: course.title,
    duration: `${course.durationMinutes / 60} Hours`,
    level: course.level,
    modules: course.modules.length,
  })),
  mode: commit ? 'commit' : 'validation-only',
};

if (!commit) {
  console.log(JSON.stringify(summary, null, 2));
  console.log('Validation passed. Re-run with --commit to replace these Behavioural course records.');
} else {
  console.log(JSON.stringify({ ...summary, ...(await replaceCourses(courses)) }, null, 2));
}
