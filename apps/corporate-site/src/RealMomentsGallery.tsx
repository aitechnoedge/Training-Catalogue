import { useEffect, useRef, useState, type FocusEvent, type MouseEvent, type PointerEvent } from 'react';
import { X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

type Photo = { kind: 'photo'; name: string; title: string; alt: string; width: number; height: number; portrait?: boolean };
type Quote = { kind: 'quote'; label: string; text: string; author: string };
type GalleryEntry = Photo | Quote;

const mediaRoot = '/website/assets/training-media/';
const thumbnail = (photo: Photo) => `${mediaRoot}${photo.name}-${photo.portrait ? 640 : 720}.webp`;
const fullImage = (photo: Photo) => `${mediaRoot}${photo.name}-1200.webp`;
const fallbackImage = (photo: Photo) => `${mediaRoot}${photo.name}.${photo.portrait ? 'jpg' : 'jpeg'}`;

function GalleryPicture({ photo, sizes }: { photo: Photo; sizes: string }) {
  return <picture>
    <source srcSet={`${thumbnail(photo)} ${photo.portrait ? 640 : 720}w, ${fullImage(photo)} 1200w`} sizes={sizes} type="image/webp" />
    <img src={fallbackImage(photo)} alt="" width={photo.width} height={photo.height} loading="lazy" decoding="async" draggable={false} />
  </picture>;
}

// Keep like-sized, like-subject images adjacent within the single coverflow.
const cohortPhotos: Photo[] = [
  { kind: 'photo', name: 'training-auditorium-wide', title: 'Learning at scale', alt: 'Large audience attending an artificial intelligence learning forum', width: 1280, height: 960 },
  { kind: 'photo', name: 'training-auditorium-selfie', title: 'A room full of learning', alt: 'Trainers and a large auditorium audience after a session', width: 1280, height: 960 },
  { kind: 'photo', name: 'training-team-campus', title: 'Learning communities', alt: 'Training cohort gathered after a learning session', width: 4000, height: 3000 },
  { kind: 'photo', name: 'training-team-corporate', title: 'Capability unlocked together', alt: 'Corporate training cohort celebrating completion', width: 1600, height: 1200 },
  { kind: 'photo', name: 'training-team-workshop', title: 'Workshop completion', alt: 'Corporate workshop participants celebrating their learning', width: 1280, height: 960 },
  { kind: 'photo', name: 'training-enterprise-team', title: 'Real people. Real capability.', alt: 'Enterprise learning community gathered after training', width: 1600, height: 1200 },
  { kind: 'photo', name: 'training-bloom-session', title: 'Learning designed for work', alt: 'Facilitator leading a technology training session', width: 1280, height: 960 },
  { kind: 'photo', name: 'training-interactive-room', title: 'Participation over presentation', alt: 'Interactive classroom with learners engaged around shared tables', width: 1600, height: 1200 },
];

const learningPhotos: Photo[] = [
  { kind: 'photo', name: 'training-classroom-intro', title: 'Instructor-led capability building', alt: 'Instructor addressing learners in a corporate classroom', width: 4032, height: 2268 },
  { kind: 'photo', name: 'training-classroom-session', title: 'Practice in progress', alt: 'Corporate learners attending a practical data storytelling session', width: 4032, height: 2268 },
  { kind: 'photo', name: 'training-ai-lab', title: 'Applied AI in the room', alt: 'Learners participating in a hands-on artificial intelligence lab', width: 1600, height: 716 },
  { kind: 'photo', name: 'training-team-global', title: 'Global teams, shared progress', alt: 'International learning team gathered after a workshop', width: 2016, height: 1134 },
];

const momentsPhotos = [...cohortPhotos, ...learningPhotos];

const quotes: Quote[] = [
  { kind: 'quote', label: 'Learner voice', text: 'Focus on real-world examples and the underlying concepts was beautiful.', author: 'Mahendra Pratap Singh' },
  { kind: 'quote', label: 'From the room', text: 'Superb presentation with lots of practical knowledge given to us.', author: 'Praful Mehta' },
  { kind: 'quote', label: 'Learner voice', text: 'Excellent and interactive. Real-world examples made everything easy to understand.', author: 'Harsh Langade' },
];

const recognitionPhotos: Photo[] = [
  { kind: 'photo', name: 'recognition-mit-memento', title: 'Military Institute of Technology memento', alt: 'Military Institute of Technology commemorative memento', width: 1650, height: 2200, portrait: true },
  { kind: 'photo', name: 'recognition-smsos-2025', title: 'SMSOS Conference 2025', alt: 'SMSOS Conference 2025 commemorative memento', width: 1650, height: 2200, portrait: true },
  { kind: 'photo', name: 'recognition-mit-letter', title: 'Appreciation from Military Institute of Technology', alt: 'Framed appreciation letter from Military Institute of Technology for a TechnoEdge skill-development course', width: 1650, height: 2200, portrait: true },
  { kind: 'photo', name: 'recognition-youtube-letter', title: 'YouTube Silver Creator recognition', alt: 'Framed letter from YouTube recognising the 100,000-subscriber milestone', width: 1650, height: 2200, portrait: true },
];

const galleryItems: GalleryEntry[] = [...momentsPhotos, ...quotes, ...recognitionPhotos];
const wrap = (value: number, length: number) => ((value % length) + length) % length;

type CoverflowLaneProps = {
  photos: Photo[];
  label: string;
  onOpen: (photo: Photo, trigger: HTMLElement) => void;
  paused: boolean;
};

const relativeIndex = (index: number, active: number, length: number) => {
  const forward = wrap(index - active, length);
  return forward > length / 2 ? forward - length : forward;
};

function CoverflowLane({ photos, label, onOpen, paused }: CoverflowLaneProps) {
  const laneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{ id: number; startX: number; startTime: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const pauseReasons = useRef(new Set<string>());
  const inViewRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const [step, setStep] = useState(240);

  const select = (index: number, announce = true) => {
    const next = wrap(index, photos.length);
    setActive(next);
    if (announce) setAnnouncement(`${photos[next].title}, ${next + 1} of ${photos.length}`);
  };

  useEffect(() => {
    const lane = laneRef.current;
    const stage = stageRef.current;
    if (!lane || !stage || reducedMotion) return;

    const measure = () => {
      const card = stage.querySelector<HTMLElement>('.moments-ticker__card');
      if (card) setStep(card.offsetWidth * .67);
    };
    const resizeObserver = new ResizeObserver(measure);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inViewRef.current = entry.isIntersecting;
    }, { rootMargin: '100px' });
    measure();
    resizeObserver.observe(stage);
    intersectionObserver.observe(lane);
    const interval = window.setInterval(() => {
      if (inViewRef.current && !document.hidden && !paused && pauseReasons.current.size === 0) {
        setActive((index) => wrap(index + 1, photos.length));
      }
    }, 500);
    return () => {
      window.clearInterval(interval);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [photos.length, paused, reducedMotion]);

  const resetStage = () => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.transition = 'transform 480ms cubic-bezier(.2,.85,.2,1)';
    stage.style.transform = '';
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointerRef.current = { id: event.pointerId, startX: event.clientX, startTime: performance.now(), moved: false };
    pauseReasons.current.add('drag');
    // Capture on the card, not the stage: capturing on the stage retargets the
    // subsequent click away from the card and prevents opening the lightbox.
    const card = (event.target as HTMLElement).closest<HTMLElement>('.moments-ticker__card');
    (card ?? event.currentTarget).setPointerCapture(event.pointerId);
    event.currentTarget.style.transition = 'none';
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    const delta = event.clientX - pointer.startX;
    if (Math.abs(delta) > 7) pointer.moved = true;
    event.currentTarget.style.transform = `translate3d(${Math.max(-165, Math.min(165, delta * .72)).toFixed(1)}px, 0, 0)`;
  };
  const finishPointer = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    const delta = event.clientX - pointer.startX;
    const velocity = delta / Math.max(performance.now() - pointer.startTime, 1);
    if (!cancelled && pointer.moved && (Math.abs(delta) > 45 || Math.abs(velocity) > .38)) {
      const count = Math.abs(delta) > step * 1.35 ? 2 : 1;
      select(active + (delta < 0 ? count : -count));
    }
    if (pointer.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    }
    pointerRef.current = null;
    pauseReasons.current.delete('drag');
    resetStage();
  };
  const onLaneBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) pauseReasons.current.delete('focus');
  };
  const onLaneKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); select(active - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); select(active + 1); }
  };

  return (
    <div
      className={`moments-ticker__lane${reducedMotion ? ' moments-ticker__lane--still' : ''}`}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      ref={laneRef}
      onMouseEnter={() => pauseReasons.current.add('hover')}
      onMouseLeave={() => pauseReasons.current.delete('hover')}
      onFocusCapture={() => pauseReasons.current.add('focus')}
      onBlurCapture={onLaneBlur}
      onKeyDown={onLaneKeyDown}
    >
      <div
        className="moments-ticker__stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => finishPointer(event)}
        onPointerCancel={(event) => finishPointer(event, true)}
      >
        {photos.map((photo, index) => {
          const offset = relativeIndex(index, active, photos.length);
          const distance = Math.abs(offset);
          const ratio = photo.width / photo.height;
          const aspectClass = ratio > 2 ? ' moments-ticker__card--panorama' : ratio > 1.5 ? ' moments-ticker__card--wide' : '';
          return <motion.button
            type="button"
            className={`moments-ticker__card${aspectClass}`}
            aria-label={index === active ? `View ${photo.title} larger` : `Show ${photo.title}`}
            aria-hidden={!reducedMotion && distance > 2 ? true : undefined}
            tabIndex={reducedMotion || distance <= 1 ? 0 : -1}
            initial={false}
            animate={reducedMotion ? undefined : {
              x: offset * step,
              y: distance * 7,
              z: -distance * 105,
              rotateY: offset === 0 ? 0 : Math.sign(offset) * -48,
              scale: Math.max(.65, 1 - distance * .14),
              opacity: distance > 2 ? 0 : distance === 2 ? .54 : distance === 1 ? .84 : 1,
            }}
            transition={{ type: 'spring', stiffness: 130, damping: 22, mass: .8 }}
            style={{ zIndex: 10 - distance, pointerEvents: !reducedMotion && distance > 2 ? 'none' : 'auto' }}
            onClick={(event) => {
              if (suppressClickRef.current) { event.preventDefault(); return; }
              if (!reducedMotion && index !== active) select(index);
              else onOpen(photo, event.currentTarget);
            }}
            key={photo.name}
          >
            <GalleryPicture photo={photo} sizes="(max-width: 767px) 72vw, (max-width: 1265px) 34vw, 430px" />
            <span>{photo.title}</span>
          </motion.button>;
        })}
      </div>
      {!reducedMotion && <div className="moments-ticker__dots" aria-label={`${label} slides`}>{photos.map((photo, index) => <button
        type="button"
        aria-label={`Show ${photo.title}`}
        aria-current={index === active ? 'true' : undefined}
        className={index === active ? 'is-active' : ''}
        onClick={() => select(index)}
        key={photo.name}
      />)}</div>}
      <span className="moments-ticker__announcement" aria-live="polite" aria-atomic="true">{announcement}</span>
    </div>
  );
}

export default function RealMomentsGallery() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const recognitionTouchStartRef = useRef<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [recognitionActive, setRecognitionActive] = useState(0);
  const reducedMotion = useReducedMotion();
  const selected = selectedIndex === null ? null : galleryItems[selectedIndex];

  useEffect(() => {
    if (selectedIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedIndex === null]);

  const openItem = (entry: GalleryEntry, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setSelectedIndex(galleryItems.indexOf(entry));
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  };
  const closeDialog = () => dialogRef.current?.close();
  const onDialogClose = () => {
    setSelectedIndex(null);
    triggerRef.current?.focus();
    triggerRef.current = null;
  };
  const stepDialog = (direction: number) => {
    setSelectedIndex((index) => index === null ? 0 : wrap(index + direction, galleryItems.length));
  };
  const onModalKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); stepDialog(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); stepDialog(1); }
  };
  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) closeDialog();
  };

  return (
    <section className="moments-gallery" id="testimonials" aria-labelledby="moments-title">
      <header className="moments-gallery__intro">
        <span>INSIDE THE EXPERIENCE</span>
        <h2 id="moments-title">
          <span className="moments-gallery__title-sans">Real</span>{' '}
          <span className="moments-gallery__title-serif">Moments.</span>{' '}
          <span className="moments-gallery__title-sans">Real</span>{' '}
          <span className="moments-gallery__title-serif">Impact.</span>
        </h2>
        <p>Real classroom moments, learner voices and recognition. Select a moment to explore.</p>
      </header>

      <div className="moments-ticker">
        <CoverflowLane photos={momentsPhotos} label="Learning communities and classroom moments" onOpen={openItem} paused={selectedIndex !== null} />
      </div>

      <div className="moments-gallery__support">
        <div className="moments-gallery__group moments-gallery__group--voices">
          <div className="moments-gallery__voices-intro">
            <h3>Learner <span>Voices</span></h3>
          </div>
          <div className="moments-gallery__quotes">
            {quotes.map((quote) => (
              <button type="button" className="moments-gallery__quote" aria-label={`Open testimonial from ${quote.author}`} onClick={(event) => openItem(quote, event.currentTarget)} key={quote.author}>
                <span className="moments-gallery__quote-mark" aria-hidden="true">
                  <svg viewBox="0 0 56 36" focusable="false">
                    <path d="M3 34V21C3 9 9.8 2 22 2v9c-5.7 0-8.7 3-9.2 8H23v15H3Zm30 0V21C33 9 39.8 2 52 2v9c-5.7 0-8.7 3-9.2 8H53v15H33Z" fill="currentColor" />
                  </svg>
                </span>
                <span className="moments-gallery__quote-rating" role="img" aria-label="Four out of five stars">★★★★</span>
                <q>{quote.text}</q>
                <span className="moments-gallery__quote-author">
                  <span className="moments-gallery__quote-avatar" aria-hidden="true">
                    {quote.author[0]}
                  </span>
                  <span className="moments-gallery__quote-identity">
                    <strong>{quote.author}</strong>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="moments-gallery__group moments-gallery__group--recognition">
          <div className="moments-gallery__recognition-layout">
            <div className="moments-gallery__recognition-story">
              <h3>Recognition</h3>
              <motion.h4
                key={recognitionPhotos[recognitionActive].name}
                initial={reducedMotion ? false : { opacity: .55, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 25 }}
                aria-live="polite"
              >{recognitionPhotos[recognitionActive].title}</motion.h4>
            </div>
            <div className="moments-gallery__recognition" aria-label="Recognition gallery">
              {recognitionPhotos.map((photo, index) => (
                <button
                  type="button"
                  className={`moments-gallery__recognition-card${index === recognitionActive ? ' is-active' : ''}`}
                  aria-label={`${index === recognitionActive ? 'View' : 'Expand'} ${photo.title}`}
                  aria-pressed={index === recognitionActive}
                  onPointerEnter={(event) => {
                    if (event.pointerType !== 'touch') setRecognitionActive(index);
                  }}
                  onPointerDown={(event) => {
                    if (event.pointerType === 'touch') recognitionTouchStartRef.current = recognitionActive;
                  }}
                  onPointerCancel={() => { recognitionTouchStartRef.current = null; }}
                  onFocus={(event) => {
                    if (event.currentTarget.matches(':focus-visible')) setRecognitionActive(index);
                  }}
                  onClick={(event) => {
                    if (recognitionTouchStartRef.current !== null) {
                      const wasActive = recognitionTouchStartRef.current === index;
                      recognitionTouchStartRef.current = null;
                      if (wasActive) openItem(photo, event.currentTarget);
                      else setRecognitionActive(index);
                      return;
                    }
                    if (index === recognitionActive) openItem(photo, event.currentTarget);
                    else setRecognitionActive(index);
                  }}
                  key={photo.name}
                >
                  <GalleryPicture photo={photo} sizes="(max-width: 767px) 90vw, (max-width: 1320px) 42vw, 470px" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <dialog className="media-lightbox" aria-label="Training moments gallery" ref={dialogRef} onClose={onDialogClose} onKeyDown={onModalKeyDown} onClick={onBackdropClick}>
        <button className="media-lightbox-close" type="button" aria-label="Close training moment" onClick={closeDialog}><X size={24} aria-hidden="true" /></button>
        <div className="media-lightbox-visual">
          {selected?.kind === 'photo' && <img src={fullImage(selected)} alt={selected.alt} />}
          {selected?.kind === 'quote' && <blockquote><span>{selected.label}</span><p>“{selected.text}”</p><footer>{selected.author}</footer></blockquote>}
        </div>
        <div className="media-lightbox-details">
          <span className="media-lightbox-eyebrow">INSIDE THE EXPERIENCE</span>
          <h3>{selected?.kind === 'photo' ? selected.title : 'In their words'}</h3>
          <p>Real moments from TechnoEdge learning and recognition.</p>
          <div className="media-lightbox-controls">
            <button type="button" aria-label="Previous moment" onClick={() => stepDialog(-1)}>←</button>
            <span>{String((selectedIndex ?? 0) + 1).padStart(2, '0')} / {String(galleryItems.length).padStart(2, '0')}</span>
            <button type="button" aria-label="Next moment" onClick={() => stepDialog(1)}>→</button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
