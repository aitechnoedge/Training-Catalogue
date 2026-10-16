import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowRight } from 'lucide-react';

const services = [
  { name: 'Content & Language', title: 'Content Processing & Language Services', subtitle: 'Make every message clear and accessible.', image: '/website/assets/services-showcase/content-language-india-v2.webp', imageAlt: 'Content specialists reviewing captions and language adaptations', visualLabel: 'Content that connects across languages' },
  { name: 'E-Learning', title: 'E-Learning Solutions', subtitle: 'Flexible by design. Consistent at scale.', image: '/website/assets/services-showcase/e-learning-india-v2.webp', imageAlt: 'Professional learner taking a digital course on a laptop', visualLabel: 'Digital learning that stays engaging' },
  { name: 'Corporate Training', title: 'Corporate Training Solutions', subtitle: 'Learn it. Practise it. Use it.', image: '/website/assets/services-showcase/corporate-training-india-v2.webp', imageAlt: 'Trainer guiding a group through a practical technology workshop', visualLabel: 'Expert-led learning, grounded in real work' },
  { name: 'AI & Automation', title: 'AI & Automation Consulting', subtitle: 'From useful idea to working process.', image: '/website/assets/services-showcase/ai-automation-india-v2.webp', imageAlt: 'Consultants reviewing an AI-supported business workflow', visualLabel: 'Practical AI for everyday operations' },
  { name: 'Data & AI Support', title: 'Data & AI Support', subtitle: 'Better data makes better AI possible.', image: '/website/assets/services-showcase/data-ai-india-v2.webp', imageAlt: 'Data specialists checking structured datasets and AI readiness', visualLabel: 'Reliable data, ready for what comes next' },
] as const;

export default function ServicesShowcase() {
  const [activeIndex, setActiveIndex] = useState(2);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef<number | null>(null);

  const move = (direction: 1 | -1) => setActiveIndex((current) => (current + direction + services.length) % services.length);

  const offsetFor = (index: number) => {
    let offset = index - activeIndex;
    if (offset > services.length / 2) offset -= services.length;
    if (offset < -services.length / 2) offset += services.length;
    return offset;
  };

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (start === null) return;
    const distance = event.clientX - start;
    dragStart.current = null;
    deckRef.current?.style.setProperty('--drag-x', '0px');
    if (Math.abs(distance) > 42) move(distance < 0 ? 1 : -1);
  };

  return (
    <section className="services-showcase section" id="services" aria-labelledby="services-heading">
      <div className="services-showcase-shell">
        <header className="services-showcase-header">
          <h2 id="services-heading">Five Services. <span>One Capability Partner.</span></h2>
        </header>

        <div className="services-carousel-tabs" role="tablist" aria-label="Choose a service">
          {services.map((service, index) => (
            <button type="button" id={`service-tab-${index}`} role="tab" aria-selected={activeIndex === index} aria-controls={`service-slide-${index}`} className={activeIndex === index ? 'is-active' : ''} onClick={() => setActiveIndex(index)} key={service.name}>{service.name}</button>
          ))}
        </div>

        <div
          className="services-card-deck"
          ref={deckRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="TechnoEdge services"
          tabIndex={0}
          onKeyDown={(event) => { if (event.key === 'ArrowLeft') move(-1); if (event.key === 'ArrowRight') move(1); }}
          onPointerDown={(event) => { dragStart.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.classList.add('is-dragging'); }}
          onPointerMove={(event) => { if (dragStart.current === null) return; const distance = Math.max(-110, Math.min(110, event.clientX - dragStart.current)); deckRef.current?.style.setProperty('--drag-x', `${distance}px`); }}
          onPointerUp={(event) => { event.currentTarget.classList.remove('is-dragging'); finishDrag(event); }}
          onPointerCancel={(event) => { event.currentTarget.classList.remove('is-dragging'); finishDrag(event); }}
        >
          {services.map((service, index) => {
            const offset = offsetFor(index);
            return (
              <div className={`services-stack-card${offset === 0 ? ' is-active' : ''}`} id={`service-slide-${index}`} role="tabpanel" aria-labelledby={`service-tab-${index}`} aria-hidden={offset !== 0} style={{ '--card-offset': offset, '--card-distance': Math.abs(offset) } as CSSProperties} key={service.name}>
                <img src={service.image} alt={service.imageAlt} loading="lazy" decoding="async" draggable="false" />
                <div className="services-stack-shade" aria-hidden="true" />
                <div className="services-stack-copy"><span>{service.visualLabel}</span><h3>{service.title}</h3><a href="#contact" tabIndex={offset === 0 ? 0 : -1}>Explore service <ArrowRight size={17} aria-hidden="true" /></a></div>
              </div>
            );
          })}
        </div>

        <div className="services-carousel-dots" aria-label="Carousel progress">
          {services.map((service, index) => <button type="button" className={activeIndex === index ? 'is-active' : ''} aria-label={`Show ${service.name}`} aria-current={activeIndex === index ? 'true' : undefined} onClick={() => setActiveIndex(index)} key={service.name} />)}
        </div>
      </div>
    </section>
  );
}
