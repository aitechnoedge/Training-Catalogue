import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { INDUSTRIES_DATA } from '../../data/learningData';
import {
  Car,
  Factory,
  Landmark,
  Microscope,
  Monitor,
  Radio,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { IndustryItem } from '../../types';
import './sculpted-cards.css';

const INDUSTRY_IMAGES: Record<string, string> = {
  automotive: '/media/industries-new/Automotive.webp',
  banking: '/media/industries-new/Banking.webp',
  energy: '/media/industries-new/Energy_Utilities.webp',
  it: '/media/industries-new/IT_Technology.webp',
  insurance: '/media/industries-new/Insurance.webp',
  logistics: '/media/industries-new/Logistics_SupplyChain.webp',
  manufacturing: '/media/industries-new/Manufacturing.webp',
  pharma: '/media/industries-new/Pharma.webp',
  retail: '/media/industries-new/Retail.webp',
  telecom: '/media/industries-new/Telecom.webp',
};

export function IndustrySelector() {
  const containerRef = useRef<HTMLElement>(null);
  const trackWindowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [scrollRange, setScrollRange] = useState(0);
  const [scrollStopperEnabled, setScrollStopperEnabled] = useState(false);

  useEffect(() => {
    const section = containerRef.current;
    if (!section) return;

    const preloaders: HTMLImageElement[] = [];
    const warmIndustryImages = () => {
      for (const source of Object.values(INDUSTRY_IMAGES)) {
        const image = new Image();
        image.decoding = 'async';
        image.src = source;
        preloaders.push(image);
        void image.decode().catch(() => undefined);
      }
    };

    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        preloadObserver.disconnect();
        warmIndustryImages();
      },
      { rootMargin: '180% 0px' },
    );

    preloadObserver.observe(section);
    return () => preloadObserver.disconnect();
  }, []);

  useLayoutEffect(() => {
    const section = containerRef.current;
    const track = trackRef.current;
    const trackWindow = trackWindowRef.current;
    if (!section || !track || !trackWindow) return;

    const desktopViewport = window.matchMedia('(min-width: 800px) and (min-height: 820px)');
    const updateMeasurements = () => {
      const enabled = desktopViewport.matches && !reduceMotion;
      const nextRange = Math.max(0, track.scrollWidth - section.clientWidth);

      setScrollStopperEnabled(enabled && nextRange > 0);
      setScrollRange(nextRange);

      if (enabled) trackWindow.scrollLeft = 0;
    };

    updateMeasurements();

    const resizeObserver = new ResizeObserver(updateMeasurements);
    resizeObserver.observe(section);
    resizeObserver.observe(track);
    desktopViewport.addEventListener('change', updateMeasurements);

    return () => {
      resizeObserver.disconnect();
      desktopViewport.removeEventListener('change', updateMeasurements);
    };
  }, [reduceMotion]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const x = useTransform(scrollYProgress, (progress) => -Math.round(progress * scrollRange));

  return (
    <section
      id="industries"
      ref={containerRef}
      className={`industry-section industry-scrollstopper bg-transparent${scrollStopperEnabled ? ' is-scrollstopper-active' : ''}`}
      style={{ '--industry-scroll-distance': `${scrollRange}px` } as CSSProperties}
    >
      <div className="industry-stage w-full py-16 sm:py-20 lg:py-24">
        
        {/* Section Header */}
        <div className="industry-intro max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-10 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08] text-[#090b10]">
              <em>Same Learning Science,</em>
              <span>Different Real-World Problems.</span>
            </h2>
            <p>Explore how the same learning principles solve very different workplace challenges.</p>
          </motion.div>
        </div>

        <div ref={trackWindowRef} className="industry-track-window w-full overflow-x-auto py-1 sm:py-2" role="region" aria-label="Industry learning examples" tabIndex={0}>
          <motion.div
            ref={trackRef}
            style={scrollStopperEnabled ? { x } : undefined}
            className="industry-track flex gap-5 sm:gap-6 lg:gap-8 pl-4 sm:pl-8 lg:pl-12 pr-12 sm:pr-20 lg:pr-24 items-stretch"
          >
            {INDUSTRIES_DATA.map((industry) => (
              <IndustryCard
                key={industry.id}
                industry={industry}
              />
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  );
}

const INDUSTRY_THEMES: Record<string, { gradient: string, lightBg: string, tagline: string }> = {
  automotive: { gradient: 'linear-gradient(100deg, #1e73d8, #124a9a)', lightBg: '#eef6ff', tagline: 'DRIVING A\nBRIGHTER TOMORROW' },
  banking: { gradient: 'linear-gradient(100deg, #185abd, #103c8c)', lightBg: '#eef4ff', tagline: 'PEOPLE FIRST\nPROGRESS ALWAYS' },
  energy: { gradient: 'linear-gradient(100deg, #07866f, #075f54)', lightBg: '#ebfaf6', tagline: 'POWERING\nSUSTAINABLE POSSIBILITIES' },
  retail: { gradient: 'linear-gradient(100deg, #d9532f, #a93a22)', lightBg: '#fff2ed', tagline: 'GOOD PEOPLE\nGREAT EXPERIENCES' },
  it: { gradient: 'linear-gradient(100deg, #1d6fe8, #3730a3)', lightBg: '#edf4ff', tagline: 'INNOVATING THE\nDIGITAL FRONTIER' },
  insurance: { gradient: 'linear-gradient(100deg, #7c3aed, #4c1d95)', lightBg: '#f4efff', tagline: 'PROTECTING WHAT\nMATTERS MOST' },
  logistics: { gradient: 'linear-gradient(100deg, #e85d04, #a63a00)', lightBg: '#fff3e8', tagline: 'DELIVERING\nWORLDWIDE EFFICIENCY' },
  manufacturing: { gradient: 'linear-gradient(100deg, #2878a9, #145374)', lightBg: '#eef8fc', tagline: 'BUILDING THE\nFUTURE TODAY' },
  pharma: { gradient: 'linear-gradient(100deg, #0d9488, #0f766e)', lightBg: '#eafbf8', tagline: 'ADVANCING\nGLOBAL HEALTH' },
  telecom: { gradient: 'linear-gradient(100deg, #635bff, #4338ca)', lightBg: '#f0efff', tagline: 'CONNECTING THE\nWORLD SEAMLESSLY' },
};

interface IndustryCardProps {
  key?: string;
  industry: IndustryItem;
}

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  automotive: Car,
  banking: Landmark,
  energy: Zap,
  insurance: ShieldCheck,
  it: Monitor,
  logistics: Truck,
  manufacturing: Factory,
  pharma: Microscope,
  retail: ShoppingBag,
  telecom: Radio,
};

function IndustryCard({ industry }: IndustryCardProps) {
  const Icon = INDUSTRY_ICONS[industry.id] || Factory;
  const theme = INDUSTRY_THEMES[industry.id] || INDUSTRY_THEMES.manufacturing;
  
  return <article 
    className="sculpted-industry-card w-[330px] sm:w-[420px] lg:w-[480px] shrink-0 select-none transition-transform duration-300 hover:-translate-y-1"
    style={{ '--card-bg': theme.lightBg, '--title-bg': theme.gradient } as CSSProperties}
  >
    <header className="industry-nameplate">
      <Icon className="industry-nameplate__icon" aria-hidden="true" />
      <span className="industry-nameplate__divider" aria-hidden="true" />
      <div className="industry-nameplate__content">
        <h3>{industry.title}</h3>
        <div className="industry-nameplate__tagline">
          {theme.tagline}
        </div>
      </div>
    </header>
    <div className="industry-diorama"><img src={INDUSTRY_IMAGES[industry.id]} alt={industry.title+' workplace clay illustration'} loading="lazy" decoding="async"/></div>
    <div className="industry-editable-panels">
      <section><h4>Typical Challenge</h4><p>{industry.challenge}</p></section>
      <section><h4>Formats That Fit</h4><p>{industry.formats}</p></section>
    </div>
  </article>;
}
