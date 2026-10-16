import React from 'react';
import { insightsHeroContent } from '../../data/insightsData';

export const InsightsHero: React.FC = () => {
  const { titleLead, titleBridge, paragraphs } = insightsHeroContent;

  return (
    <section className="insights-hero" aria-labelledby="insights-page-title">
      <div className="insights-shell insights-hero__inner">
        <h1 id="insights-page-title">
          <span>{titleLead}</span>
          <span>{titleBridge}</span>
        </h1>

        <div className="insights-hero__copy">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
};
