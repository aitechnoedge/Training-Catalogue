import { ArrowUpRight } from 'lucide-react';
import corporateRoom from '../assets/hero-v5/corporate-room-lms.webp';
import corporateRoomMobile from '../assets/hero-v5/corporate-room-lms-mobile.webp';
import corporateRoomMobile2x from '../assets/hero-v5/corporate-room-lms-mobile-2x.webp';
import { ParallaxComponent } from './ui/parallax-scrolling';

export function LayeredCorporateHero() {
  return (
    <ParallaxComponent id="hero" className="layered-hero cinematic-hero">
      <img
        data-parallax-layer="background"
        className="layered-hero__room"
        src={corporateRoomMobile}
        srcSet={`${corporateRoomMobile} 471w, ${corporateRoomMobile2x} 824w, ${corporateRoom} 1672w`}
        sizes="100vw"
        alt="Indian corporate team discussing a digital learning experience"
        width={1672}
        height={941}
        fetchPriority="high"
      />
      <div data-parallax-layer="light" className="layered-hero__depth-light" aria-hidden="true" />
      <div data-parallax-layer="wash" className="layered-hero__wash" />

      <div data-parallax-layer="copy" className="layered-hero__copy">
        <h1 aria-label="We create content your team actually opens.">
          <span className="hero-headline-line">We Create</span>
          <span className="hero-headline-line">Content <span className="is-accent">Your</span></span>
          <span className="hero-headline-line is-accent">Team Actually</span>
          <span className="hero-headline-line is-accent">Opens.</span>
        </h1>
        <p className="hero-second-hook">Boring content, minus the <span className="hook-strike">boring</span>.</p>
        <div className="hero-actions">
          <a className="hero-main-action" href="#document-intro">
            <span>Turn my</span>
            <span className="rotating-word"><b>PPT</b></span>
            <span>into this</span> <ArrowUpRight size={20} />
          </a>
        </div>
      </div>
    </ParallaxComponent>
  );
}
