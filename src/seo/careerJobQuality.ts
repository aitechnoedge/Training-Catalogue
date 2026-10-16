import type { CareerJob } from '../data/careersData';

export interface CareerJobQualityResult {
  eligible: boolean;
  blockers: string[];
}

const isFutureDate = (value: string | undefined, now: Date) => {
  if (!value) return false;
  // A schema.org validThrough value may be a calendar date. Treat that form as
  // the end of the specified day rather than expiring the vacancy at midnight.
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999Z` : value);
  return !Number.isNaN(date.getTime()) && date.getTime() > now.getTime();
};

const isValidDate = (value: string | undefined) => {
  if (!value) return false;
  return !Number.isNaN(new Date(value).getTime());
};

export const auditCareerJob = (job: CareerJob, now = new Date()): CareerJobQualityResult => {
  const blockers: string[] = [];
  if (job.description.trim().length < 160) blockers.push('role_description');
  if (job.responsibilities.length < 3) blockers.push('responsibilities');
  if (job.requirements.length < 3) blockers.push('requirements');
  if (job.applicationInstructions.trim().length < 40) blockers.push('application_instructions');
  if (!job.location?.trim()) blockers.push('location');
  if (!isValidDate(job.datePosted)) blockers.push('date_posted');
  if (!isFutureDate(job.validThrough, now)) blockers.push('valid_through');
  return { eligible: blockers.length === 0, blockers };
};

export const isIndexableCareerJob = (job: CareerJob, now = new Date()) => job.indexable && auditCareerJob(job, now).eligible;
