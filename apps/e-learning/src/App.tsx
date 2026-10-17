import { lazy, Suspense, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { LayeredCorporateHero } from './components/LayeredCorporateHero';
import { GlassCursor } from './components/ui/glass-cursor';
import { FooterStructure } from '../../../src/components/FooterStructure';
import { AnalyticsConsent } from '../../../src/components/AnalyticsConsent';
import './components/continuation/continuation.css';

const SopStory = lazy(() => import('./components/SopStory').then((module) => ({ default: module.SopStory })));
const LearningUniverse = lazy(() => import('./components/continuation/LearningUniverse').then((module) => ({ default: module.LearningUniverse })));
const LevelComparisonMatrix = lazy(() => import('./components/continuation/LevelComparisonMatrix').then((module) => ({ default: module.LevelComparisonMatrix })));
const ContinuationIndustries = lazy(() => import('./components/continuation/IndustrySelector').then((module) => ({ default: module.IndustrySelector })));
const ContinuationContact = lazy(() => import('./components/continuation/ContactSection').then((module) => ({ default: module.ContactSection })));
const SectionDivider = lazy(() => import('./components/SectionDivider').then((module) => ({ default: module.SectionDivider })));

export default function App() {
  const readingProgressRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    document.documentElement.style.overflow = '';

    let frame = 0;
    const update = () => {
      frame = 0;
      const available = document.documentElement.scrollHeight - window.innerHeight;
      const progress = available > 0 ? window.scrollY / available : 0;
      if (readingProgressRef.current) {
        readingProgressRef.current.style.transform = `scaleX(${progress})`;
      }
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    document.body.classList.remove('cursor-none');
    update();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      document.documentElement.style.overflow = '';
      document.body.classList.remove('cursor-none');
    };
  }, []);

  return (
    <div className="site-shell">
      <GlassCursor />
      <div className="reading-progress"><i ref={readingProgressRef} /></div>
      <div className="site-content">
        <Header />
        <main>
          <LayeredCorporateHero />
          <Suspense fallback={<section className="section-divider" role="status">Loading e-learning capabilities…</section>}>
          <SopStory />
          <LearningUniverse />
          <SectionDivider id="divider-formats-depth" />
          <LevelComparisonMatrix />
          <SectionDivider id="divider-depth-industries" />
          <ContinuationIndustries />
          <SectionDivider id="divider-industries-contact" />
          <ContinuationContact />
          </Suspense>
        </main>
        <FooterStructure />
      </div>
      <AnalyticsConsent />
    </div>
  );
}
