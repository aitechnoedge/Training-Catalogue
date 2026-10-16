import React from 'react';

export const AboutTechnoEdge: React.FC = () => (
  <section className="careers-editorial-section" aria-labelledby="careers-about-title">
    <div className="careers-page-shell careers-editorial-section__grid">
      <div>
        <p className="careers-section-label">About TechnoEdge</p>
        <h2 id="careers-about-title">
          <span>Learning Technology</span>
          <span className="careers-editorial-section__heading-accent">and Innovation.</span>
        </h2>
      </div>
      <div className="careers-editorial-section__copy">
        <p>
          At TechnoEdge, we work at the intersection of learning, technology, and innovation building practical solutions that help people perform better and businesses move forward.
        </p>
        <p>
          We combine industry knowledge with modern tools to create learning experiences and solutions that are relevant, effective, and built for real-world needs.
        </p>
      </div>
    </div>
  </section>
);
