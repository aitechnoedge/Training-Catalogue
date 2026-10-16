import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, Check } from 'lucide-react';
import { SOPPaper } from './SOPPaper';
import { ScrollExpand } from './ScrollExpand';
import './learning-journey.css';
import './sop-paper.css';
import './sop-story.css';

const COURSE_VIDEO = '/media/learning-v1.mp4?v=final';
const COURSE_POSTER = '/media/learner-journey-poster.jpg';

function CourseVideo({ className = '' }: { className?: string }) {
  return <div className={`journey-video ${className}`.trim()}>
    <video src={COURSE_VIDEO} poster={COURSE_POSTER} muted loop playsInline preload="none" aria-label="Converted e-learning video" />
    <span>From SOP to a learning experience</span>
  </div>;
}

export function SopStory() {
  const journey = useRef<HTMLDivElement>(null);
  const traveller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(min-width: 761px)', () => {
      const root = journey.current!;
      const card = traveller.current!;
      const point = (selector: string) => {
        const target = root.querySelector(selector)!.getBoundingClientRect();
        const parent = root.getBoundingClientRect();
        return { x: target.left - parent.left, y: target.top - parent.top, width: target.width, height: target.height };
      };
      const context = gsap.context(() => {
        let from = point('[data-journey-anchor="1"]');
        let to = point('[data-journey-anchor="2"]');
        const mix = (a: number, b: number, amount: number) => a + (b - a) * amount;
        const smooth = (value: number) => {
          const t = Math.max(0, Math.min(1, value));
          return t * t * t * (t * (t * 6 - 15) + 10);
        };
        const glow = root.querySelector('.journey-glow');
        const paperFace = root.querySelector('.journey-paper-face');
        const lessonFace = root.querySelector('.journey-lesson-face');
        const learnerBefore = root.querySelector('.learner-before');
        const thoughtBefore = root.querySelector('.journey-before .learner-thought');
        const transformedSection = root.querySelector('#transformed')!;
        const render = (rawProgress: number) => {
          const progress = Math.max(0, Math.min(1, rawProgress));
          // Keep the SOP intact while it travels, let it settle, then use one
          // edge-on half turn to hide the aspect-ratio change into the video.
          const travel = smooth(progress / .68);
          const flip = smooth((progress - .76) / .22);
          // Complete the portrait-to-16:9 geometry change while the card is
          // edge-on, so neither face is ever shown with the wrong proportions.
          const morph = smooth((progress - .855) / .03);
          const beforeGone = smooth((progress - .34) / .2);
          const travelArc = Math.sin(Math.PI * travel) * (1 - flip);
          const flipArc = Math.sin(Math.PI * flip);
          gsap.set(card, {
            left: 0, top: 0,
            x: mix(from.x, to.x, travel),
            y: mix(from.y, to.y, travel) - travelArc * 18,
            z: travelArc * 38 + flipArc * 72,
            width: mix(from.width, to.width, morph),
            height: mix(from.height, to.height, morph),
            rotationY: 180 * flip,
            rotationX: -1.25 * travelArc,
            rotationZ: 0,
            scale: 1 - flipArc * .028,
            opacity: transformedSection.getBoundingClientRect().top <= .5 ? 0 : 1,
            zIndex: 2,
            transformOrigin: '50% 50%',
            transformPerspective: 1800,
            visibility: 'visible',
          });
          gsap.set(paperFace, { opacity: 1 });
          gsap.set(lessonFace, { opacity: 1 });
          gsap.set(glow, { opacity: flipArc * .32, scale: 1 + flipArc * .28 });
          gsap.set([learnerBefore, thoughtBefore], {
            opacity: 1 - beforeGone,
            y: -16 * beforeGone,
            visibility: beforeGone >= .995 ? 'hidden' : 'visible',
          });
        };
        const measure = () => {
          from = point('[data-journey-anchor="1"]');
          to = point('[data-journey-anchor="2"]');
        };
        measure();
        const playhead = { progress: 0 };
        const transition = gsap.to(playhead, {
          progress: 1,
          duration: 1,
          ease: 'none',
          paused: true,
          onUpdate: () => render(playhead.progress),
        });
        ScrollTrigger.create({
          trigger: '#problems',
          start: 'top top',
          endTrigger: '#transformed',
          end: 'top top',
          animation: transition,
          scrub: .42,
          invalidateOnRefresh: true,
          onRefreshInit: measure,
          onRefresh: () => render(playhead.progress),
        });
        render(0);
      }, root);
      const refresh = () => ScrollTrigger.refresh();
      root.querySelectorAll('img').forEach(item => item.addEventListener('load', refresh));
      return () => {
        root.querySelectorAll('img').forEach(item => item.removeEventListener('load', refresh));
        context.revert();
      };
    });
    return () => media.revert();
  }, []);

  return <section id="document-intro" className="sop-story" aria-label="From a boring SOP to a course people finish">
    <div ref={journey} className="learning-journey sop-transform">
      <section id="problems" className="journey-chapter journey-before" aria-labelledby="before-heading">
        <div className="journey-chapter-inner">
          <div className="journey-visual">
            <div data-journey-anchor="1" className="journey-anchor before-paper-slot" />
            <div className="journey-static-paper"><SOPPaper /></div>
            <div className="learner-portrait learner-before" role="img" aria-label="A puzzled learner trying to understand a long procedure" />
            <span className="learner-thought">“Where do I even start?”</span>
          </div>
          <div className="journey-copy">
            <h2 id="before-heading" className="sop-editorial-heading">
              <span>A boring SOP.</span>
              <em>A Useful Idea<br />Waiting Inside.</em>
            </h2>
            <p>A familiar document. Important information. And a person who needs to know what to do next.</p>
            <p>We keep the knowledge. Then we give it a story, a moment to practise, and a reason to remember.</p>
            <a className="sop-primary-action" href="#transformed">Let’s bring it to life <ArrowDown size={17} /></a>
            <div className="journey-chips"><span>Dense documents</span><span>Long presentations</span><span>Process manuals</span></div>
          </div>
        </div>
      </section>

      <ScrollExpand
        id="transformed"
        className="sop-video-expand"
        src={COURSE_VIDEO}
        poster={COURSE_POSTER}
        mediaType="video"
        startWidth={43}
        startHeight={28}
        startAspectRatio={16 / 9}
        startMaxHeight={40}
        startRight={5}
        startLeft={52}
        startTop={12}
        startRadius={16}
        endRadius={0}
        mediaZoom={1.02}
        scrollDistance={1.15}
        holdDistance={0.85}
        smoothing={0.12}
        overlayScrim={0}
        playAtProgress={0.08}
        expandedAtProgress={0.98}
        revealStart={0.035}
        revealEnd={0.16}
        expansionStart={0.24}
        surroundingsFadeStart={0.5}
        surroundingsFadeEnd={0.78}
        useWindowScroll
        surroundings={<div className="journey-after-surface" aria-labelledby="after-heading">
          <div data-journey-anchor="2" className="journey-anchor journey-transform-target" />
          <div className="journey-copy">
            <h2 id="after-heading" className="sop-editorial-heading">
              <span>Now It’s a Lesson.</span>
              <em>And a Little<br />“I’ve Got This.”</em>
            </h2>
            <p>The same SOP becomes a short, visual learning experience. Watch a real situation, make a choice, and get feedback you can use.</p>
            <div className="journey-chips"><span><Check size={12} /> Interactive</span><span><Check size={12} /> Bite-sized</span><span><Check size={12} /> SCORM + xAPI</span></div>
          </div>
          <div data-scroll-reveal className="learner-portrait learner-after" role="img" aria-label="The same learner smiling with understanding and confidence" />
          <span data-scroll-reveal className="learner-thought learner-thought-after">“That makes sense. Let me try.”</span>
        </div>}
      />

      <div ref={traveller} className="journey-traveller">
        <div className="journey-glow" />
        <div className="journey-paper-face"><SOPPaper /></div>
        <div className="journey-lesson-face"><CourseVideo /></div>
      </div>
    </div>
  </section>;
}
