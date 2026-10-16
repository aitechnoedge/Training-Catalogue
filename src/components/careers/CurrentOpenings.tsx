import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { CareerJob } from '../../data/careersData';

interface CurrentOpeningsProps {
  jobs: CareerJob[];
  onViewRole: (job: CareerJob) => void;
}

export const CurrentOpenings: React.FC<CurrentOpeningsProps> = ({ jobs, onViewRole }) => (
  <section id="current-openings" className="careers-openings-section" aria-labelledby="careers-openings-title">
    <div className="careers-page-shell">
      <div className="careers-openings-section__heading">
        <p className="careers-section-label">Current openings</p>
        <h2 id="careers-openings-title">Open Roles at <span>TechnoEdge</span></h2>
      </div>

      <div className="careers-job-list">
        {jobs.map((job) => (
          <article className="careers-job-row" key={job.id}>
            <span className="careers-job-row__number">{String(job.id).padStart(2, '0')}</span>
            <div className="careers-job-row__main">
              <h3>{job.title}</h3>
              <p>{[job.department, job.type, job.location].filter(Boolean).join(' · ')}</p>
            </div>
            <a
              href={`/careers/${encodeURIComponent(job.slug)}`}
              onClick={(event) => { event.preventDefault(); onViewRole(job); }}
              className="careers-job-row__action"
            >
              View role
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </article>
        ))}
      </div>
    </div>
  </section>
);
