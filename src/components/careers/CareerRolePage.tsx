import React from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { careerJobs } from '../../data/careersData';
import { CAREERS_EMAIL } from '../../data/siteContact';

interface CareerRolePageProps {
  slug: string;
  onBack: () => void;
}

export const CareerRolePage: React.FC<CareerRolePageProps> = ({ slug, onBack }) => {
  const job = careerJobs.find((item) => item.slug === slug);

  if (!job) {
    return (
      <section className="career-role-page">
        <div className="careers-page-shell career-role-page__empty">
          <p className="careers-section-label">Careers at TechnoEdge</p>
          <h1>Role not found</h1>
          <a href="/careers" className="careers-primary-button" onClick={(event) => { event.preventDefault(); onBack(); }}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to careers
          </a>
        </div>
      </section>
    );
  }

  const applicationLink = `mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(`Application for ${job.title}`)}`;

  return (
    <section className="career-role-page" aria-labelledby="career-role-title">
      <div className="careers-page-shell">
        <nav className="career-role-page__breadcrumbs" aria-label="Breadcrumbs">
          <a href="/">Home</a>
          <span aria-hidden="true">/</span>
          <a href="/careers" onClick={(event) => { event.preventDefault(); onBack(); }}>Careers</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{job.title}</span>
        </nav>
        <div className="career-role-page__content">
          <div>
            <p className="careers-section-label">Careers at TechnoEdge</p>
            <h1 id="career-role-title">{job.title}</h1>
            <p className="career-role-page__meta">
              {[job.department, job.type, job.location].filter(Boolean).join(' · ')}
            </p>
          </div>
          <a href={applicationLink} className="careers-primary-button">
            Apply by email
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
        <div className="career-role-page__details">
          <section aria-labelledby="role-overview-heading">
            <h2 id="role-overview-heading">About this role</h2>
            <p>{job.description}</p>
          </section>
          <section aria-labelledby="role-responsibilities-heading">
            <h2 id="role-responsibilities-heading">What you’ll work on</h2>
            <ul>{job.responsibilities.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section aria-labelledby="role-requirements-heading">
            <h2 id="role-requirements-heading">What we’re looking for</h2>
            <ul>{job.requirements.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section aria-labelledby="role-application-heading">
            <h2 id="role-application-heading">Application process</h2>
            <p>{job.applicationInstructions}</p>
            <p>Our careers team reviews relevant experience and contacts suitable applicants about the next step.</p>
          </section>
          <section aria-labelledby="role-company-heading">
            <h2 id="role-company-heading">Working at TechnoEdge</h2>
            <p>TechnoEdge brings together learning, content, technology and AI capabilities to help enterprise teams build practical skills and improve how work gets done.</p>
          </section>
        </div>
      </div>
    </section>
  );
};
