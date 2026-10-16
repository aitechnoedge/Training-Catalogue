import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { insightsArticles } from '../../../src/data/insightsData';

const latestArticles = insightsArticles.slice(0, 3);

export default function HomeInsightsSection() {
  return (
    <section className="home-insights section" id="insights" aria-labelledby="home-insights-heading">
      <div className="home-insights-shell">
        <header className="home-insights-header">
          <div>
            <h2 id="home-insights-heading">Latest Insights</h2>
          </div>
          <a className="home-insights-all" href="/insights">Explore all insights <ArrowUpRight size={18} aria-hidden="true" /></a>
        </header>

        <div className="home-insights-grid">
          {latestArticles.map((article, index) => (
            <article className="home-insights-card" key={article.id}>
              <div className="home-insights-card-top">
                <span className="home-insights-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="home-insights-category">{article.category}</span>
              </div>
              <div className="home-insights-media">
                {article.image ? (
                  <img src={article.image} alt="" loading="lazy" />
                ) : (
                  <div className="home-insights-media-fallback" aria-hidden="true">
                    <span className="home-insights-media-monogram">TE.</span>
                    <span className="home-insights-media-caption">INSIGHTS / {String(index + 1).padStart(2, '0')}</span>
                  </div>
                )}
              </div>
              <h3><a href={article.url}>{article.title}</a></h3>
              <div className="home-insights-card-bottom">
                <span className="home-insights-date"><CalendarDays size={15} aria-hidden="true" />{article.date}</span>
                <a className="home-insights-read" href={article.url} aria-label={`Read ${article.title}`}><ArrowUpRight size={18} aria-hidden="true" /></a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
