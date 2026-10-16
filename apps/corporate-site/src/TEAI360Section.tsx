import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { BrainCircuit, Lightbulb, Network, Rocket, Workflow } from 'lucide-react';
import './teai360-ascent.css';

const stages = [
  {
    name: 'Awareness',
    headline: 'Understand where AI creates value.',
    description: 'Build shared AI literacy, recognise relevant opportunities, and establish the principles for safe, responsible use.',
    icon: Lightbulb,
    color: '#F0F7FF', edge: '#73C2FB', text: '#01266A', height: '42%',
  },
  {
    name: 'Adoption',
    headline: 'Put trusted AI tools into daily work.',
    description: 'Equip teams with role-based practice, reliable tools, and repeatable habits that turn awareness into practical use.',
    icon: Network,
    color: 'color-mix(in srgb, #73C2FB 54%, #F0F7FF)', edge: '#73C2FB', text: '#01266A', height: '54%',
  },
  {
    name: 'Automation',
    headline: 'Redesign repeatable work.',
    description: 'Connect processes and systems so routine tasks can run faster, consistently, and with the right human oversight.',
    icon: Workflow,
    color: '#73C2FB', edge: '#2666C4', text: '#01266A', height: '66%',
  },
  {
    name: 'Augmentation',
    headline: 'Amplify judgement and expertise.',
    description: 'Embed intelligent assistance into complex work so people can analyse, decide, create, and deliver with greater confidence.',
    icon: BrainCircuit,
    color: '#2666C4', edge: '#01266A', text: '#FFFFFF', height: '79%',
  },
  {
    name: 'Acceleration',
    headline: 'Scale AI as an enterprise capability.',
    description: 'Operationalise proven use cases across functions with governance, measurement, and a system for continuous improvement.',
    icon: Rocket,
    color: '#01266A', edge: '#01266A', text: '#FFFFFF', height: '93%',
  },
] as const;

export default function TEAI360Section() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageWindowRef = useRef<HTMLDivElement>(null);
  const swipeFrameRef = useRef(0);
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timer: number | undefined;
    const stopSlideshow = () => {
      if (timer !== undefined) window.clearInterval(timer);
      timer = undefined;
    };
    const startSlideshow = () => {
      stopSlideshow();
      timer = window.setInterval(() => {
        if (!document.hidden) setActiveStage((current) => (current + 1) % stages.length);
      }, 1000);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setActiveStage(0);
        startSlideshow();
      } else {
        stopSlideshow();
      }
    }, { threshold: .35 });

    observer.observe(section);
    return () => {
      observer.disconnect();
      stopSlideshow();
      if (swipeFrameRef.current) window.cancelAnimationFrame(swipeFrameRef.current);
    };
  }, []);

  const active = stages[activeStage];
  const selectStage = (index: number) => {
    setActiveStage(index);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stageWindow = stageWindowRef.current;
    const usesHorizontalJourney = reducedMotion || window.matchMedia('(max-width: 650px)').matches;
    if (stageWindow && usesHorizontalJourney) {
      const target = stageWindow.querySelector<HTMLButtonElement>(`[data-stage-index="${index}"]`);
      if (target) {
        stageWindow.scrollTo({
          left: target.offsetLeft - (stageWindow.clientWidth - target.offsetWidth) / 2,
          behavior: reducedMotion ? 'auto' : 'smooth',
        });
      }
      return;
    }
  };

  useEffect(() => {
    if (!window.matchMedia('(max-width: 650px)').matches) return;
    const stageWindow = stageWindowRef.current;
    const target = stageWindow?.querySelector<HTMLButtonElement>(`[data-stage-index="${activeStage}"]`);
    if (!stageWindow || !target) return;
    stageWindow.scrollTo({
      left: target.offsetLeft - (stageWindow.clientWidth - target.offsetWidth) / 2,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }, [activeStage]);

  const updateStageFromSwipe = () => {
    const usesHorizontalJourney = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || window.matchMedia('(max-width: 650px)').matches;
    if (!usesHorizontalJourney || !stageWindowRef.current) return;
    if (swipeFrameRef.current) window.cancelAnimationFrame(swipeFrameRef.current);
    swipeFrameRef.current = window.requestAnimationFrame(() => {
      swipeFrameRef.current = 0;
      const stageWindow = stageWindowRef.current;
      if (!stageWindow) return;
      const viewportCenter = stageWindow.scrollLeft + stageWindow.clientWidth / 2;
      const stageButtons = Array.from(stageWindow.querySelectorAll<HTMLButtonElement>('[data-stage-index]'));
      const closest = stageButtons.reduce((best, button) => {
        const distance = Math.abs(button.offsetLeft + button.offsetWidth / 2 - viewportCenter);
        return distance < best.distance
          ? { index: Number(button.dataset.stageIndex), distance }
          : best;
      }, { index: 0, distance: Number.POSITIVE_INFINITY });
      setActiveStage((current) => (current === closest.index ? current : closest.index));
    });
  };

  const tiltStage = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontal = (event.clientX - bounds.left) / bounds.width - .5;
    const vertical = (event.clientY - bounds.top) / bounds.height - .5;
    event.currentTarget.style.setProperty('--tilt-x', `${(-vertical * 8).toFixed(2)}deg`);
    event.currentTarget.style.setProperty('--tilt-y', `${(horizontal * 11).toFixed(2)}deg`);
  };

  const resetStageTilt = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.removeProperty('--tilt-x');
    event.currentTarget.style.removeProperty('--tilt-y');
  };

  return (
    <section className="ai-framework-scroll" id="ai-journey" ref={sectionRef} aria-labelledby="teai360-title">
      <div className="ai-framework">
        <header className="ai-framework-heading">
          <h2 id="teai360-title">TE-AI360</h2>
          <p>Five levels that turn AI ambition into organisational capability.</p>
        </header>

        <div className="ai-framework-layout">
          <div className="ai-framework-copy" key={active.name} aria-live="polite">
            <h3>{active.name}</h3>
            <strong>{active.headline}</strong>
            <p>{active.description}</p>
            <div className="ai-framework-progress" aria-hidden="true">
              {stages.map((stage, index) => (
                <span className={index <= activeStage ? 'is-filled' : ''} key={stage.name} />
              ))}
            </div>
          </div>

          <div
            className="ai-framework-stage-window"
            role="group"
            aria-label="Five AI capability stages. Swipe or choose a stage to explore it."
            ref={stageWindowRef}
            onScroll={updateStageFromSwipe}
          >
            <div
              className="ai-framework-stage-set"
              style={{ '--journey-progress': `${((activeStage + .5) / stages.length) * 100}%` } as CSSProperties}
            >
              <div className="ai-framework-floor-reflection" aria-hidden="true" />
              <div className="ai-framework-energy-track" aria-hidden="true">
                <span className="ai-framework-energy-fill" />
                <span className="ai-framework-energy-pulse" />
                {stages.map((stage, index) => (
                  <i className={index <= activeStage ? 'is-reached' : ''} key={stage.name} />
                ))}
              </div>
              {stages.map((stage, index) => {
                const state = index === activeStage ? 'active' : index < activeStage ? 'complete' : 'upcoming';
                const StageIcon = stage.icon;
                return (
                  <button
                    type="button"
                    className="ai-framework-stage"
                    data-state={state}
                    data-stage-index={index}
                    aria-current={state === 'active' ? 'step' : undefined}
                    aria-pressed={state === 'active'}
                    onClick={() => selectStage(index)}
                    onPointerMove={tiltStage}
                    onPointerLeave={resetStageTilt}
                    onPointerCancel={resetStageTilt}
                    style={{
                      '--stage-color': stage.color,
                      '--stage-edge': stage.edge,
                      '--stage-text': stage.text,
                      '--stage-height': stage.height,
                    } as CSSProperties}
                    key={stage.name}
                  >
                    <span className="ai-framework-stage-icon" aria-hidden="true"><StageIcon /></span>
                    <span className="ai-framework-stage-number">{String(index + 1).padStart(2, '0')}</span>
                    <h3>{stage.name}</h3>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
