import React from 'react';
import { FeaturedArticle } from './FeaturedArticle';
import { FeaturedPostsPanel } from './FeaturedPostsPanel';
import type { InsightArticle } from '../../data/insightsData';

export const EditorsPicksSection: React.FC<{ articles: InsightArticle[] }> = ({ articles }) => (
  <section className="editors-picks" aria-labelledby="editors-picks-title">
    <div className="insights-shell">
      <h2 id="editors-picks-title">Latest Insight</h2>
      <div className="editors-picks__grid">
        <FeaturedArticle article={articles[0]} />
        <FeaturedPostsPanel articles={articles} />
      </div>
    </div>
  </section>
);
