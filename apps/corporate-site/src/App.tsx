import { lazy, Suspense, useEffect, useState } from 'react';
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

interface GalleryImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

function GalleryImage({ src, alt, width, height }: GalleryImageProps) {
  const optimizedSource = src.replace(/\.(?:jpe?g)$/i, '-1200.webp');

  return (
    <picture>
      <source srcSet={optimizedSource} type="image/webp" />
      <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
    </picture>
  );
}

function CorporateInteractions() {
  useEffect(() => mountCorporateInteractions(), []);
  return null;
}

function CorporateHome() {
  const [showAllMoments, setShowAllMoments] = useState(false);

  return (
    <div id="corporate-site">

  <div id="top" aria-hidden="true"></div>
  <a className="skip-link" href="#main">Skip to content</a>
  <header className="site-header">
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
  </header>

  <main id="main">
    <HeroRotator />

    <Suspense fallback={<div className="section" role="status">Loading TechnoEdge capabilities…</div>}>
    <ClientLogosSection />

    <section className="impact" aria-labelledby="impact-title">
      <div className="impact-shell">
        <header className="impact-intro">
          <h2 id="impact-title">Built Through <em>Experience.</em><br />Proven Through <em>Scale.</em></h2>
          <p>Four measures of the capability we build with teams worldwide.</p>
        </header>
        <div className="impact-grid" aria-label="Company metrics">
          <article className="impact-card"><div className="impact-value"><strong data-count="200">0</strong><span>+</span></div><p>Clients Globally</p><small>Enterprise learning engagements worldwide</small></article>
          <article className="impact-card"><div className="impact-value"><strong data-count="3500">0</strong><span>+</span></div><p>Training Hours</p><small>Across critical technologies</small></article>
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

    <section className="media-universe" id="testimonials" aria-labelledby="media-universe-title">
      <div className="media-pin">
        <header className="media-universe-intro">
          <span>INSIDE THE EXPERIENCE</span>
          <h2 id="media-universe-title">Real Moments. <em>Real Impact.</em></h2>
          <p>Real classroom moments, learner voices and recognition. Select a moment to explore.</p>
        </header>

        <div className="media-field">
          <div className={`media-world${showAllMoments ? ' is-expanded' : ''}`} id="real-moments-grid">
            <figure className="media-node media-photo" data-focus="0.06" data-x="390" data-y="310" data-zoom="1.06" style={{ '--wx': '390px', '--wy': '310px', '--node-width': '520px', '--depth': '-60px' } as React.CSSProperties}>
              <GalleryImage src="/website/assets/training-media/training-auditorium-wide.jpeg" alt="Large audience attending an artificial intelligence learning forum" width={1280} height={960} />
              <figcaption>Learning at scale</figcaption>
            </figure>

            <blockquote className="media-node media-quote" data-focus="0.12" data-x="920" data-y="245" data-zoom="1.28" style={{ '--wx': '920px', '--wy': '245px', '--node-width': '380px', '--depth': '35px' } as React.CSSProperties}>
              <span>LEARNER VOICE</span><p>“Focus on real-world examples and the underlying concepts was beautiful.”</p><footer>Mahendra Pratap Singh</footer>
            </blockquote>

            <figure className="media-node media-photo" data-focus="0.18" data-x="1510" data-y="290" data-zoom="1.02" style={{ '--wx': '1510px', '--wy': '290px', '--node-width': '560px', '--depth': '-20px' } as React.CSSProperties}>
              <GalleryImage src="/website/assets/training-media/training-classroom-intro.jpeg" alt="Instructor addressing learners in a corporate classroom" width={4032} height={2268} />
              <figcaption>Instructor-led capability building</figcaption>
            </figure>

            <figure className="media-node media-photo media-tall" data-focus="0.24" data-x="2070" data-y="420" data-zoom="1.12" style={{ '--wx': '2070px', '--wy': '420px', '--node-width': '430px', '--depth': '50px' } as React.CSSProperties}>
              <GalleryImage src="/website/assets/training-media/training-team-campus.jpeg" alt="Training cohort gathered after a learning session" width={4000} height={3000} />
              <figcaption>Learning communities</figcaption>
            </figure>

            <blockquote className="media-node media-quote media-quote-blue" data-focus="0.30" data-x="1900" data-y="840" data-zoom="1.26" style={{ '--wx': '1900px', '--wy': '840px', '--node-width': '400px', '--depth': '15px' } as React.CSSProperties}>
              <span>FROM THE ROOM</span><p>“Superb presentation with lots of practical knowledge given to us.”</p><footer>Praful Mehta</footer>
            </blockquote>

            <figure className="media-node media-photo" data-focus="0.36" data-x="1420" data-y="1070" data-zoom="1.04" style={{ '--wx': '1420px', '--wy': '1070px', '--node-width': '560px', '--depth': '-45px' } as React.CSSProperties}>
              <GalleryImage src="/website/assets/training-media/training-ai-lab.jpeg" alt="Learners participating in a hands-on artificial intelligence lab" width={1600} height={716} />
              <figcaption>Applied AI in the room</figcaption>
            </figure>

            <figure className="media-node media-photo media-tall" data-focus="0.42" data-x="860" data-y="1160" data-zoom="1.22" style={{ '--wx': '860px', '--wy': '1160px', '--node-width': '360px', '--depth': '70px' } as React.CSSProperties}>
              <GalleryImage src="/website/assets/training-media/training-auditorium-selfie.jpeg" alt="Trainers and a large auditorium audience after a session" width={1280} height={960} />
              <figcaption>A room full of learning</figcaption>
            </figure>

            <figure className="media-node media-photo" data-focus="0.48" data-x="340" data-y="990" data-zoom="1.08" style={{ '--wx': '340px', '--wy': '990px', '--node-width': '500px', '--depth': '-10px' } as React.CSSProperties}>
              <GalleryImage src="/website/assets/training-media/training-team-global.jpeg" alt="International learning team gathered after a workshop" width={2016} height={1134} />
              <figcaption>Global teams, shared progress</figcaption>
            </figure>

            <blockquote className="media-node media-quote" data-focus="0.54" data-x="310" data-y="610" data-zoom="1.3" style={{ '--wx': '310px', '--wy': '610px', '--node-width': '390px', '--depth': '55px' } as React.CSSProperties}>
              <span>LEARNER VOICE</span><p>“Excellent and interactive. Real-world examples made everything easy to understand.”</p><footer>Harsh Langade</footer>
            </blockquote>

            <figure className="media-node media-photo" data-focus="0.60" data-x="820" data-y="690" data-zoom="1.02" style={{ '--wx': '820px', '--wy': '690px', '--node-width': '570px', '--depth': '-65px' } as React.CSSProperties}>
              <GalleryImage src="/website/assets/training-media/training-classroom-session.jpeg" alt="Corporate learners attending a practical data storytelling session" width={4032} height={2268} />
              <figcaption>Practice in progress</figcaption>
            </figure>

            <figure className="media-node media-photo" data-focus="0.66" data-x="1320" data-y="600" data-zoom="1.08" style={{ '--wx': '1320px', '--wy': '600px', '--node-width': '500px', '--depth': '25px' } as React.CSSProperties}>
              <GalleryImage src="/website/assets/training-media/training-team-corporate.jpeg" alt="Corporate training cohort celebrating completion" width={1600} height={1200} />
              <figcaption>Capability unlocked together</figcaption>
            </figure>

            <figure className="media-node media-photo" data-focus="0.72" data-x="1780" data-y="590" data-zoom="1.1" style={{ '--wx': '1780px', '--wy': '590px', '--node-width': '470px', '--depth': '-25px' } as React.CSSProperties}>
              <GalleryImage src="/website/assets/training-media/training-team-workshop.jpeg" alt="Corporate workshop participants celebrating their learning" width={1280} height={960} />
              <figcaption>Workshop completion</figcaption>
            </figure>

            <figure className="media-node media-photo" data-focus="0.78" data-x="2100" data-y="1080" data-zoom="1.02" style={{ '--wx': '2100px', '--wy': '1080px', '--node-width': '520px', '--depth': '35px' } as React.CSSProperties}>
              <GalleryImage src="/website/assets/training-media/training-bloom-session.jpeg" alt="Facilitator leading a technology training session" width={1280} height={960} />
              <figcaption>Learning designed for work</figcaption>
            </figure>

            <figure className="media-node media-photo" data-focus="0.85" data-x="1510" data-y="1370" data-zoom="1.05" style={{ '--wx': '1510px', '--wy': '1370px', '--node-width': '540px', '--depth': '-40px' } as React.CSSProperties}>
              <GalleryImage src="/website/assets/training-media/training-interactive-room.jpeg" alt="Interactive classroom with learners engaged around shared tables" width={1600} height={1200} />
              <figcaption>Participation over presentation</figcaption>
            </figure>

            <figure className="media-node media-photo" data-focus="0.92" data-x="690" data-y="1370" data-zoom="1.04" style={{ '--wx': '690px', '--wy': '1370px', '--node-width': '560px', '--depth': '30px' } as React.CSSProperties}>
              <GalleryImage src="/website/assets/training-media/training-enterprise-team.jpeg" alt="Enterprise learning community gathered after training" width={1600} height={1200} />
              <figcaption>Real people. Real capability.</figcaption>
            </figure>

            <figure className="media-node media-photo media-recognition" style={{ '--node-width': '390px' } as React.CSSProperties}>
              <GalleryImage src="/website/assets/training-media/recognition-mit-memento.jpg" alt="Military Institute of Technology commemorative memento" width={1650} height={2200} />
              <figcaption>Military Institute of Technology memento</figcaption>
            </figure>

            <figure className="media-node media-photo media-recognition" style={{ '--node-width': '360px' } as React.CSSProperties}>
              <GalleryImage src="/website/assets/training-media/recognition-smsos-2025.jpg" alt="SMSOS Conference 2025 commemorative memento" width={1650} height={2200} />
              <figcaption>SMSOS Conference 2025</figcaption>
            </figure>

            <figure className="media-node media-photo media-recognition" style={{ '--node-width': '350px' } as React.CSSProperties}>
              <GalleryImage src="/website/assets/training-media/recognition-mit-letter.jpg" alt="Framed appreciation letter from Military Institute of Technology for a TechnoEdge skill-development course" width={1650} height={2200} />
              <figcaption>Appreciation from Military Institute of Technology</figcaption>
            </figure>

            <figure className="media-node media-photo media-recognition" style={{ '--node-width': '350px' } as React.CSSProperties}>
              <GalleryImage src="/website/assets/training-media/recognition-youtube-letter.jpg" alt="Framed letter from YouTube recognising the 100,000-subscriber milestone" width={1650} height={2200} />
              <figcaption>YouTube Silver Creator recognition</figcaption>
            </figure>
          </div>
        </div>

        <button
          type="button"
          className="media-more-toggle"
          aria-controls="real-moments-grid"
          aria-expanded={showAllMoments}
          onClick={() => setShowAllMoments((expanded) => !expanded)}
        >
          {showAllMoments ? 'Show fewer moments' : 'View all moments'}
        </button>

      </div>

      <dialog className="media-lightbox" aria-label="Training moments gallery">
        <button className="media-lightbox-close" type="button" aria-label="Close training moment"><X size={24} aria-hidden="true" /></button>
        <div className="media-lightbox-visual">
          <img alt="" hidden />
          <blockquote hidden><span></span><p></p><footer></footer></blockquote>
        </div>
        <div className="media-lightbox-details">
          <span className="media-lightbox-eyebrow">INSIDE THE EXPERIENCE</span>
          <h3></h3>
          <p>Real moments from TechnoEdge learning and recognition.</p>
          <div className="media-lightbox-controls">
            <button type="button" data-media-previous aria-label="Previous moment">←</button>
            <span data-media-count>01 / 20</span>
            <button type="button" data-media-next aria-label="Next moment">→</button>
          </div>
        </div>
      </dialog>
    </section>

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

function CareersPageRoute() {
  const navigate = useNavigate();
  return <CareersRoute onViewRole={(slug) => navigate(`/careers/${slug}`)} />;
}

function CareerRolePageRoute() {
  const navigate = useNavigate();
  const { slug = '' } = useParams();
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
