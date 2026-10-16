import React from 'react';
import { careerPhotos, careerPrinciples } from '../../data/careersData';
import { CareerFlashcard } from './CareerFlashcard';
import { CareerPhotoGallery } from './CareerPhotoGallery';

export const WhyJoinTechnoEdge: React.FC = () => (
  <section className="careers-why-section" aria-labelledby="careers-why-title">
    <div className="careers-page-shell">
      <div className="careers-why-section__heading">
        <p className="careers-section-label">Why join TechnoEdge</p>
        <h2 id="careers-why-title">Learn. <span>Build.</span> Grow.</h2>
      </div>

      <CareerPhotoGallery photos={careerPhotos} />

      <div className="careers-principles">
        <svg className="careers-principles__path" viewBox="0 0 1200 210" preserveAspectRatio="none" aria-hidden="true">
          <path d="M 10 112 C 210 12, 365 205, 594 105 S 970 12, 1190 105" />
        </svg>
        {careerPrinciples.map((principle, index) => (
          <CareerFlashcard key={principle.number} {...principle} position={index} />
        ))}
      </div>
    </div>
  </section>
);
