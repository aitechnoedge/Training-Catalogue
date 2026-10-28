import { lazy, Suspense, useEffect, useLayoutEffect } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ArrowUp, Menu, X } from 'lucide-react';
import { mountCorporateInteractions } from './interactions';
import HeroRotator from './HeroRotator';
import { FooterStructure } from '../../../src/components/FooterStructure';
import { CONTACT_PHONES, whatsappUrl } from '../../../src/data/siteContact';
import { AnalyticsConsent } from '../../../src/components/AnalyticsConsent';
import TrainingRoiPage from './TrainingRoiPage';
import { CareerRoleRoute, CareersRoute } from './CareersRoute';

const TEAI360Section = lazy(() => import('./TEAI360Section'));
const ServicesShowcase = lazy(() => import('./ServicesShowcase'));
const HomeInsightsSection = lazy(() => import('./HomeInsightsSection'));
const ClientLogosSection = lazy(() => import('./ClientLogosSection'));
const ContactSection = lazy(() => import('./ContactSection'));
const RealMomentsGallery = lazy(() => import('./RealMomentsGallery'));

function CorporateInteractions() {
  useEffect(() => mountCorporateInteractions(), []);
  return null;
}

function CorporateHome() {
  return (
    <div id="corporate-site">

  <div id="top" aria-hidden="true"></div>
  <a className="skip-link" href="#main">Skip to content</a>
  <header className="site-header">
    <div className="site-header__inner te-page-container">
    <a className="brand" href="/" aria-label="TechnoEdge home"><img src="/website/assets/technoedge-logo.png" alt="TechnoEdge Learning Services" /></a>
    <button className="menu-toggle" aria-expanded="false" aria-controls="primary-nav"><Menu className="menu-open-icon" size={28} aria-hidden="true" /><X className="menu-close-icon" size={28} aria-hidden="true" /><span className="sr-only">Menu</span></button>
    <nav id="primary-nav" className="primary-nav" aria-label="Primary navigation">
      <a href="/" aria-current="page">Home</a>
      <a href="/e-learning/">E-Learning</a>
      <a href="/catalogue">Catalogue</a>
      <a href="/insights">Insights</a>
      <a href="/careers">Careers</a>
      <a href="/training-roi">Training ROI</a>
    </nav>
    <div className="header-actions">
      <a className="btn btn-solid" href="#ai-journey">AI Capability Journey</a>
      <a className="btn btn-outline" href="#contact">Talk To Us</a>
    </div>
    </div>
  </header>

  <main id="main">
    <HeroRotator />

    <Suspense fallback={<div className="section" role="status">Loading TechnoEdge capabilities…</div>}>
    <ClientLogosSection />

    <section className="impact" aria-labelledby="impact-title">
      <div className="impact-shell">
        <header className="impact-intro">
          <h2 id="impact-title">
            <span className="impact-title-line">Built Through <em>Experience.</em></span>
            <span className="impact-title-line">Proven Through <em>Scale.</em></span>
          </h2>
          <p>Four measures of the capability we build with teams worldwide.</p>
        </header>
        <div className="impact-grid" aria-label="Company metrics">
          <article className="impact-card"><div className="impact-value"><strong data-count="100">0</strong><span>+</span></div><p>Clients Globally</p><small>Enterprise learning engagements worldwide</small></article>
          <article className="impact-card"><div className="impact-value"><strong data-count="50000">0</strong><span>+</span></div><p>Training Hours</p><small>Across critical technologies</small></article>
          <article className="impact-card"><div className="impact-value"><strong data-count="3000">0</strong><span>+</span></div><p>Courses Supported</p><small>Mapped to roles and outcomes</small></article>
          <article className="impact-card"><div className="impact-value"><strong data-count="1500">0</strong><span>+</span></div><p>Content Hours</p><small>Designed for repeatable learning</small></article>
        </div>
      </div>
    </section>

    <ServicesShowcase />

    <TEAI360Section />

    <section className="why why-unified section" aria-labelledby="why-heading">
      <header className="why-unified-intro">
        <span className="eyebrow">WHY TECHNOEDGE</span>
        <h2 id="why-heading">Built to <em>Teach.</em><br />Recognised to <em>Deliver.</em></h2>
        <p>Five years of helping teams turn learning into practical capability through expert-led training, digital experiences and AI-enabled solutions.</p>
      </header>
      <div className="why-unified-showcase" aria-label="TechnoEdge partnerships, recognition and experience">
        <figure className="why-proof-card why-proof-dpiit">
          <span className="why-proof-label">DPIIT RECOGNITION</span>
          <div className="why-proof-logo"><img src="/website/assets/partnerships/dpiit-recognition.webp" alt="DPIIT recognition emblem" loading="lazy" decoding="async" /></div>
          <figcaption>Recognised by DPIIT</figcaption>
        </figure>
        <figure className="why-proof-card why-proof-skilling">
          <span className="why-proof-label">MICROSOFT SKILLING PARTNERSHIP</span>
          <div className="why-proof-logo"><img src="/website/assets/partnerships/microsoft-training-skilling-partner-badge.webp" alt="Microsoft Training Skilling Partner badge" loading="lazy" decoding="async" /></div>
          <figcaption>Microsoft Training Skilling Partner</figcaption>
        </figure>
        <figure className="why-proof-card why-proof-startup">
          <span className="why-proof-label">STARTUP INDIA RECOGNITION</span>
          <div className="why-proof-logo"><img src="/website/assets/partnerships/startup-india.webp" alt="Startup India emblem" loading="lazy" decoding="async" /></div>
          <figcaption>Startup India</figcaption>
        </figure>
      </div>
    </section>

    <HomeInsightsSection />

    <RealMomentsGallery />

    <ContactSection />
    <CorporateInteractions />
    </Suspense>
  </main>

  <FooterStructure />

  <div className="ai-contact">
    <div className="contact-choices" id="contact-choices">
      {CONTACT_PHONES.map((phone) => (
        <a href={whatsappUrl(phone)} target="_blank" rel="noopener noreferrer" key={`whatsapp-${phone.number}`}><b>Chat on WhatsApp</b><span>{phone.display}</span></a>
      ))}
      {CONTACT_PHONES.map((phone) => (
        <a href={`tel:${phone.e164}`} key={`call-${phone.number}`}><b>Call our team</b><span>{phone.display}</span></a>
      ))}
    </div>
    <button className="ai-bot-button" aria-expanded="false" aria-controls="contact-choices"><img src="/website/assets/contact-host-optimized.png" alt="A welcoming TechnoEdge host—open contact options" decoding="async" /><span>Talk to us</span></button>
  </div>
  <a className="back-top" href="#top" aria-label="Back to top"><ArrowUp size={20} aria-hidden="true" /></a>
  <AnalyticsConsent />
  

    </div>
  );
}

function useCareerRouteScrollToTop(routeKey: string) {
  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, [routeKey]);
}

function CareersPageRoute() {
  useCareerRouteScrollToTop('careers');
  const navigate = useNavigate();
  return <CareersRoute onViewRole={(slug) => navigate(`/careers/${slug}`)} />;
}

function CareerRolePageRoute() {
  const navigate = useNavigate();
  const { slug = '' } = useParams();
  useCareerRouteScrollToTop(slug);
  return <CareerRoleRoute slug={slug} onBack={() => navigate('/careers')} />;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<CorporateHome />} />
    <Route path="/careers" element={<CareersPageRoute />} />
    <Route path="/careers/:slug" element={<CareerRolePageRoute />} />
    <Route path="/training-roi" element={<TrainingRoiPage />} />
  </Routes>;
}
