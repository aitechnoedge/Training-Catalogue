import React from 'react';
import { ArrowDown } from 'lucide-react';

interface CareersHeroProps {
  onViewOpenings: () => void;
}

export const CareersHero: React.FC<CareersHeroProps> = ({ onViewOpenings }) => (
  <section className="careers-hero" aria-labelledby="careers-page-title">
    <div className="careers-hero__inner">
      <div className="careers-hero__content">
        <p className="careers-section-label">Careers at TechnoEdge</p>
        <h1 id="careers-page-title">
          <span>Build the Future</span>
          <span>While Building Yourself</span>
        </h1>
        <p className="careers-hero__copy">
          Grow your skills, take ownership, and create work that makes a difference.
        </p>
        <button type="button" className="careers-primary-button" onClick={onViewOpenings}>
          View Open Roles
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  </section>
);
