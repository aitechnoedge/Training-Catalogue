import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { careerJobs } from '../src/data/careersData';
import { auditCareerJob, isIndexableCareerJob } from '../src/seo/careerJobQuality';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportDirectory = path.join(projectRoot, 'artifacts', 'seo');
const generatedAt = new Date().toISOString();
const results = careerJobs.map((job) => ({
  slug: job.slug,
  title: job.title,
  requestedIndexing: job.indexable,
  approvedForIndexing: isIndexableCareerJob(job),
  ...auditCareerJob(job),
}));
const invalidIndexableJobs = results.filter((job) => job.requestedIndexing && !job.approvedForIndexing);

await mkdir(reportDirectory, { recursive: true });
await writeFile(
  path.join(reportDirectory, 'career-quality-report.json'),
  `${JSON.stringify({ generatedAt, jobs: results }, null, 2)}\n`,
  'utf8',
);

if (invalidIndexableJobs.length) {
  throw new Error(`Career SEO quality gate failed for: ${invalidIndexableJobs.map((job) => `${job.slug} (${job.blockers.join(', ')})`).join('; ')}`);
}

console.log(`Career SEO quality gate: ${results.filter((job) => job.approvedForIndexing).length} approved; ${results.length - results.filter((job) => job.approvedForIndexing).length} held for employer verification.`);
