import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  motion,
  AnimatePresence,
} from 'motion/react';
import { WORLDS_DATA } from '../../data/f1LearningData';
import { DemoType } from '../../types';
import './learning-universe.css';
import {
  Play,
  Pause,
  Award,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Volume2,
} from 'lucide-react';

const FORMAT_ORDER = [
  'scorm',
  'ai',
  'micro',
  'game',
  'simulation',
  'assessment',
  'video',
  'ilt',
  'immersive',
] as const;

const ORDERED_WORLDS = [...WORLDS_DATA].sort(
  (a, b) => FORMAT_ORDER.indexOf(a.id as (typeof FORMAT_ORDER)[number])
    - FORMAT_ORDER.indexOf(b.id as (typeof FORMAT_ORDER)[number])
);

const formatSceneBase = `${import.meta.env.BASE_URL}media/format-scenes/`;

export function LearningUniverse() {
  const items = ORDERED_WORLDS;
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    },
    [goPrev, goNext]
  );

  // Scroll only the dock horizontally; never move the document on mount.
  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    const dock = listRef.current;
    if (!el || !dock) return;
    const itemRect = el.getBoundingClientRect();
    const dockRect = dock.getBoundingClientRect();
    dock.scrollTo({
      left: dock.scrollLeft + itemRect.left - dockRect.left - (dock.clientWidth - itemRect.width) / 2,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }, [activeIndex]);

  const currentWorld = items[activeIndex] || items[0];

  // Mini-demo internal interactive states
  const [scormTab, setScormTab] = useState<number>(1);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(24);
  const [xp, setXp] = useState(0);
  const [simStep, setSimStep] = useState(0);
  const [hazardSpotted, setHazardSpotted] = useState(false);
  const [assessmentSelected, setAssessmentSelected] = useState<number | null>(null);
  const [iltStage, setIltStage] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(40);
  const [aiEmp, setAiEmp] = useState<number | null>(null);
  const [aiCla, setAiCla] = useState<number | null>(null);
  const [aiSelected, setAiSelected] = useState<number | null>(null);

  const renderDemo = (type: DemoType) => {
    switch (type) {
      case 'track':
        return (
          <div className="flex flex-col gap-3">
            <div className="relative w-full rounded-3xl overflow-hidden border border-[#0b0b0d]/10 bg-white/40 backdrop-blur-md shadow-sm aspect-video flex items-center justify-center group cursor-pointer">
              <img 
                src={`${formatSceneBase}e-learning-scorm.png`}
                alt="SCORM course player with an e-mobility learning module"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ mixBlendMode: 'darken' }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="flex flex-col gap-3">
            <div className="relative w-full rounded-3xl overflow-hidden border border-[#0b0b0d]/10 bg-white/40 backdrop-blur-md shadow-sm aspect-video flex items-center justify-center group cursor-pointer">
              <img 
                src={`${formatSceneBase}e-learning-video.png`}
                alt="Cybersecurity awareness video lesson with playback controls"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ mixBlendMode: 'darken' }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col gap-3">
            <div className="relative w-full rounded-3xl overflow-hidden border border-[#0b0b0d]/10 bg-white/40 backdrop-blur-md shadow-sm aspect-video flex items-center justify-center group cursor-pointer">
              <img 
                src="/src/assets/images/audio_learning_3d_isometric_v2_1788594202251.jpg" 
                alt="3D Illustration of Audio Learning"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ mixBlendMode: 'darken' }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        );

      case 'micro':
        return (
          <div className="flex flex-col gap-3">
            <div className="relative w-full rounded-3xl overflow-hidden border border-[#0b0b0d]/10 bg-white/40 backdrop-blur-md shadow-sm aspect-video flex items-center justify-center group cursor-pointer">
              <img 
                src={`${formatSceneBase}e-learning-micro.png`}
                alt="Microlearning hub with short video lessons and job aids"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ mixBlendMode: 'darken' }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        );

      case 'game':
        return (
          <div className="flex flex-col gap-3">
            <div className="relative w-full rounded-3xl overflow-hidden border border-[#0b0b0d]/10 bg-white/40 backdrop-blur-md shadow-sm aspect-video flex items-center justify-center group cursor-pointer">
              <img 
                src={`${formatSceneBase}e-learning-game.png`}
                alt="Cybersecurity phishing mission with a start button and progress bar"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ mixBlendMode: 'darken' }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        );

      case 'sim':
        return (
          <div className="flex flex-col gap-3">
            <div className="relative w-full rounded-3xl overflow-hidden border border-[#0b0b0d]/10 bg-white/40 backdrop-blur-md shadow-sm aspect-video flex items-center justify-center group cursor-pointer">
              <img 
                src={`${formatSceneBase}e-learning-simulation.png`}
                alt="Supply chain receiving simulation with shipment details and action choices"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ mixBlendMode: 'darken' }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        );

      case 'immersive':
        return (
          <div className="flex flex-col gap-3">
            <div className="relative w-full rounded-3xl overflow-hidden border border-[#0b0b0d]/10 bg-white/40 backdrop-blur-md shadow-sm aspect-video flex items-center justify-center group cursor-pointer">
              <img 
                src={`${formatSceneBase}e-learning-immersive.png`}
                alt="Operational safety inspection with interactive equipment checkpoints"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ mixBlendMode: 'darken' }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        );

      case 'assessment':
        return (
          <div className="flex flex-col gap-3">
            <div className="relative w-full rounded-3xl overflow-hidden border border-[#0b0b0d]/10 bg-white/40 backdrop-blur-md shadow-sm aspect-video flex items-center justify-center group cursor-pointer">
              <img 
                src={`${formatSceneBase}e-learning-assessment.png`}
                alt="Customer service assessment with a multiple choice question and score panel"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ mixBlendMode: 'darken' }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        );

      case 'ilt':
        return (
          <div className="flex flex-col gap-3">
            <div className="relative w-full rounded-3xl overflow-hidden border border-[#0b0b0d]/10 bg-white/40 backdrop-blur-md shadow-sm aspect-video flex items-center justify-center group cursor-pointer">
              <img 
                src={`${formatSceneBase}e-learning-ilt.png`}
                alt="Instructor led workshop connected to a virtual classroom"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ mixBlendMode: 'darken' }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="flex flex-col gap-3">
            <div className="relative w-full rounded-3xl overflow-hidden border border-[#0b0b0d]/10 bg-white/40 backdrop-blur-md shadow-sm aspect-video flex items-center justify-center group cursor-pointer">
              <img 
                src={`${formatSceneBase}e-learning-ai.png`}
                alt="AI interview practice with a video interviewer and feedback scores"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ mixBlendMode: 'darken' }}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section
      id="formats"
      className="f1-learning-universe min-h-screen py-12 sm:py-16 lg:py-20 flex flex-col justify-center relative overflow-hidden"
    >
      {/* Dynamic Ambient Backlight matching site palette */}
      <div className="absolute top-1/4 right-1/4 w-[480px] h-[480px] rounded-full bg-[#7557ff]/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[480px] h-[480px] rounded-full bg-[#34d8b2]/10 blur-[130px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full"
      >
        {/* Unified Frame Container */}
        <div className="formats-single-frame bg-white/40 backdrop-blur-3xl rounded-[32px] sm:rounded-[40px] p-5 sm:p-6 lg:p-7 shadow-[0_8px_32px_rgba(11,11,13,0.04)] border border-white/60">
          <div className="relative flex flex-col items-center gap-4 mb-5 sm:mb-6 sm:min-h-[78px] sm:items-end sm:justify-end">
            <div className="text-center sm:absolute sm:left-1/2 sm:-translate-x-1/2">
              <h2 className="leading-[1.02]" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>
                <span className="format-heading-kicker block text-2xl sm:text-3xl font-semibold italic">Pick A Format</span>
                <span className="format-heading-title block text-3xl sm:text-4xl lg:text-5xl font-bold sm:whitespace-nowrap">We’ll Make The Case For It.</span>
              </h2>
            </div>

            {/* Stepper Navigation: Prev / Next buttons + Counter */}
            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <span className="text-xs font-mono font-bold text-[#6a6872] px-2">
              <strong className="text-[#0b0b0d]">{String(activeIndex + 1).padStart(2, '0')}</strong>
              {' / '}
              {String(items.length).padStart(2, '0')}
            </span>

            <motion.button
              type="button"
              onClick={goPrev}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              className="w-9 h-9 rounded-xl bg-white border border-[#0b0b0d]/15 hover:border-[#7557ff] text-[#0b0b0d] hover:text-[#7557ff] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
              aria-label="Previous modality"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            <motion.button
              type="button"
              onClick={goNext}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              className="w-9 h-9 rounded-xl bg-white border border-[#0b0b0d]/15 hover:border-[#7557ff] text-[#0b0b0d] hover:text-[#7557ff] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
              aria-label="Next modality"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
            </div>
          </div>

        {/* ========================================================================= */}
        {/* FRAMER-STYLE TOPICS DOCK (All 10 Modalities in One Interactive Strip)     */}
        {/* ========================================================================= */}
        <div className="mb-4 sm:mb-5 relative">
          <div
            ref={listRef}
            tabIndex={0}
            role="tablist"
            aria-label="Learning Modality Selection Bar"
            onKeyDown={onKeyDown}
            className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 focus:outline-none scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((it, idx) => {
              const isSelected = idx === activeIndex;

              return (
                <button
                  key={it.id}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  role="tab"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className="relative shrink-0 px-3.5 sm:px-4 py-2 rounded-2xl flex items-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer select-none focus:outline-none"
                >
                  {/* Framer-grade animated sliding spring pill */}
                  {isSelected && (
                    <motion.div
                      layoutId="activeModalityPill"
                      className="absolute inset-0 bg-[#226FA7] rounded-2xl shadow-[0_8px_24px_rgba(34,111,167,0.24)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}

                  {/* Index */}
                  <span
                    className={`relative z-10 font-mono text-[11px] font-black transition-colors ${
                      isSelected ? 'text-white' : 'text-[#8a8894]'
                    }`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* Name */}
                  <span
                    className={`relative z-10 transition-colors ${
                      isSelected
                        ? 'text-white font-extrabold'
                        : 'text-[#333138] hover:text-[#0b0b0d]'
                    }`}
                  >
                    {it.name}
                  </span>

                  {/* Active Indicator Pulse */}
                  {isSelected && (
                    <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-[#34d8b2] animate-pulse" />
                  )}

                  {/* Inactive hover border pill */}
                  {!isSelected && (
                    <div className="absolute inset-0 rounded-2xl bg-white/70 border border-[#0b0b0d]/10 hover:border-[#7557ff]/40 hover:bg-white transition-all -z-10" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FRAMER-STYLE BENTO STAGE (Strategic Brief + Playable Sandbox in One Frame) */}
        {/* ========================================================================= */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={`modality-${currentWorld.id}`}
              initial={{ opacity: 0, y: 14, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch"
            >
              {/* CARD 1: Strategic Brief (lg:col-span-5) */}
              <div className="lg:col-span-5 bg-white text-[#0b0b0d] rounded-3xl p-5 sm:p-6 lg:p-7 shadow-[0_16px_40px_-15px_rgba(11,11,13,0.08)] border border-[#0b0b0d]/12 flex flex-col justify-between relative overflow-hidden">
                {/* Top Corner Decor */}
                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-[#ece8df] to-white border-b border-l border-[#0b0b0d]/10 rounded-bl-2xl pointer-events-none" />

                <div>
                  {/* Modality Identity */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#0b0b0d]/10">
                    <div className="w-11 h-11 rounded-2xl bg-white text-[#0b0b0d] flex items-center justify-center font-black text-xl shadow-sm shrink-0 border border-[#0b0b0d]/12">
                      {currentWorld.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl sm:text-2xl font-semibold text-[#01266A] leading-tight truncate">
                        {currentWorld.name}
                      </h3>
                      <span className="text-xs text-[#727175] font-semibold block truncate">
                        {currentWorld.sub}
                      </span>
                    </div>
                  </div>

                  <div className="format-description">
                    <p className="flex items-start gap-2"><span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-[#0b0b0d]/40 shrink-0"></span><span>{currentWorld.bullets[0]}</span></p>
                    <p className="flex items-start gap-2 mt-2"><span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-[#0b0b0d]/40 shrink-0"></span><span>{currentWorld.bullets[1]}</span></p>
                    <p className="format-promise mt-3 pt-3 border-t border-[#0b0b0d]/10 text-[#0b0b0d] italic text-xs sm:text-sm font-semibold">{currentWorld.bullets[2]}</p>
                  </div>
                </div>

                {/* Bottom Blueprint Request CTA */}
                <div className="mt-6 pt-4 border-t border-[#0b0b0d]/10">
                  <a
                    href="#contact"
                    className="format-blueprint-cta w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#226FA7] text-white font-bold text-xs sm:text-sm hover:bg-[#17557F] transition-all cursor-pointer shadow-[0_8px_22px_rgba(34,111,167,0.24)] group"
                  >
                    <span>Request {currentWorld.name} Blueprint</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>

              {/* CARD 2: Interactive Sandbox & Live Simulation (lg:col-span-7) */}
              <div className="lg:col-span-7 bg-[#faf8f2] text-[#0b0b0d] rounded-3xl p-5 sm:p-6 lg:p-7 shadow-[0_16px_40px_-15px_rgba(11,11,13,0.08)] border border-[#0b0b0d]/12 flex flex-col justify-between relative overflow-hidden">
                <div>
                  {/* Sandbox Header */}
                  <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold text-[#727175] mb-4 pb-3.5 border-b border-[#0b0b0d]/10">
                    <span className="flex items-center gap-2 text-[#01266A] font-semibold text-sm sm:text-base">
                      <Sparkles className="w-4 h-4 text-[#7557ff]" />
                      {currentWorld.type === 'track' 
                        ? 'Universal LMS Integration & Telemetry' 
                        : currentWorld.type === 'video'
                        ? 'High-Impact Video Learning'
                        : currentWorld.type === 'audio'
                        ? 'Screen-Free Audio Learning'
                        : currentWorld.type === 'micro'
                        ? 'Just-In-Time Micro-learning'
                        : currentWorld.type === 'game'
                        ? 'Mastery-Driven Gamification'
                        : currentWorld.type === 'sim'
                        ? 'Risk-Free Systems Simulation'
                        : currentWorld.type === 'immersive'
                        ? 'Immersive 3D & VR Training'
                        : currentWorld.type === 'assessment'
                        ? 'Smart Competency Assessments'
                        : currentWorld.type === 'support'
                        ? 'Instant Performance Support'
                        : currentWorld.type === 'ilt'
                        ? 'Blended Live Facilitation (ILT/VILT)'
                        : currentWorld.type === 'ai'
                        ? 'AI-Powered Coaching & Roleplay'
                        : 'Interactive Sandbox & Live Simulation'}
                    </span>
                  </div>

                  {/* Render the specific live sandbox */}
                  <div className="py-1">
                    {renderDemo(currentWorld.type)}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        </div>
      </motion.div>
    </section>
  );
}

