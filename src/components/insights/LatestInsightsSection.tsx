import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  insightCategories,
  type InsightArticle,
} from '../../data/insightsData';
import { BlogCard } from './BlogCard';
import { InsightsCategoryFilters, type InsightsFilter } from './InsightsCategoryFilters';
import { InsightsPagination } from './InsightsPagination';

const articlesPerPage = 12;

export const LatestInsightsSection: React.FC<{ articles: InsightArticle[] }> = ({ articles }) => {
  const [activeCategory, setActiveCategory] = useState<InsightsFilter>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [outgoingArticles, setOutgoingArticles] = useState<InsightArticle[] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const transitionTimer = useRef<number | null>(null);

  const filteredArticles = useMemo(() => (
    activeCategory === 'All'
      ? articles
      : articles.filter((article) => article.category === activeCategory)
  ), [activeCategory, articles]);

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / articlesPerPage));
  const visibleArticles = filteredArticles.slice(
    (currentPage - 1) * articlesPerPage,
    currentPage * articlesPerPage,
  );

  useEffect(() => () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
  }, []);

  const finishTransition = () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    transitionTimer.current = window.setTimeout(() => {
      setOutgoingArticles(null);
      setIsAnimating(false);
      transitionTimer.current = null;
    }, reducedMotion ? 0 : 300);
  };

  const scrollToSection = () => {
    window.requestAnimationFrame(() => {
      document.getElementById('latest-insights')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handlePageChange = (nextPage: number) => {
    const clampedPage = Math.min(Math.max(nextPage, 1), totalPages);
    if (isAnimating || clampedPage === currentPage) return;
    setOutgoingArticles(visibleArticles);
    setIsAnimating(true);
    setCurrentPage(clampedPage);
    scrollToSection();
    finishTransition();
  };

  const handleCategoryChange = (category: InsightsFilter) => {
    if (isAnimating || category === activeCategory) return;
    setOutgoingArticles(visibleArticles);
    setIsAnimating(true);
    setActiveCategory(category);
    setCurrentPage(1);
    finishTransition();
  };

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <section id="latest-insights" className="latest-insights" aria-labelledby="latest-insights-title">
      <div className="insights-shell">
        <div className="latest-insights__heading-row">
          <div className="latest-insights__heading-copy">
            <p className="latest-insights__eyebrow">Knowledge for what&apos;s next</p>
            <h2 id="latest-insights-title">Other Insights</h2>
          </div>

          <div className="latest-insights__quick-nav" aria-label="Quick page navigation">
            <button
              type="button"
              aria-label="Previous page"
              disabled={isAnimating || isFirstPage}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={isAnimating || isLastPage}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>

        <InsightsCategoryFilters
          categories={insightCategories}
          activeCategory={activeCategory}
          disabled={isAnimating}
          onChange={handleCategoryChange}
        />

        <div className="latest-insights__grid-stage" aria-live="polite" aria-busy={isAnimating}>
          <div className={`latest-insights__grid${isAnimating ? ' latest-insights__grid--incoming' : ''}`}>
            {visibleArticles.map((article, index) => (
              <BlogCard key={article.id} article={article} index={index} />
            ))}
          </div>

          {outgoingArticles && (
            <div className="latest-insights__grid latest-insights__grid--outgoing" aria-hidden="true">
              {outgoingArticles.map((article, index) => (
                <BlogCard key={`outgoing-${article.id}`} article={article} index={index} interactive={false} />
              ))}
            </div>
          )}
        </div>

        <InsightsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          disabled={isAnimating}
          onPageChange={handlePageChange}
        />
      </div>
    </section>
  );
};
