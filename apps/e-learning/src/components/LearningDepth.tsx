import { useState, useRef } from 'react';
import { DEPTH_DATA } from '../data/learningData';
import { LearnerIllustration } from './LearnerIllustration';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'motion/react';

export function LearningDepth() {
  type LearningLevel = 1 | 2 | 3 | 4;
  const [level, setLevel] = useState<LearningLevel>(1);
  const containerRef = useRef<HTMLElement>(null);
  const isClickScrollingRef = useRef<boolean>(false);
  const clickTimeoutRef = useRef<number | null>(null);

  // Monitor scroll progress across the container runway
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Automatically update the active cognitive level as the user scrolls through the track
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (isClickScrollingRef.current) return;

    let targetLvl: LearningLevel = 1;
    if (latest < 0.25) {
      targetLvl = 1;
    } else if (latest < 0.5) {
      targetLvl = 2;
    } else if (latest < 0.75) {
      targetLvl = 3;
    } else {
      targetLvl = 4;
    }

    setLevel(targetLvl);
  });

  // Smoothly jump to specific level on click
  const handleLevelSelect = (targetLevel: LearningLevel) => {
    setLevel(targetLevel);
    if (!containerRef.current) return;

    isClickScrollingRef.current = true;
    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
    }

    const rect = containerRef.current.getBoundingClientRect();
    const absoluteTop = window.scrollY + rect.top;
    const totalHeight = containerRef.current.offsetHeight;
    const viewportHeight = window.innerHeight;
    const scrollableDistance = Math.max(totalHeight - viewportHeight, 1);

    // Position in track: L1 = 0.08, L2 = 0.35, L3 = 0.62, L4 = 0.90
    const progressPositions = [0.08, 0.35, 0.62, 0.9];
    const targetProgress = progressPositions[targetLevel - 1] ?? 0.08;
    const targetY = absoluteTop + scrollableDistance * targetProgress;

    window.scrollTo({
      top: targetY,
      behavior: 'smooth',
    });

    clickTimeoutRef.current = window.setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 700);
  };

  const current = DEPTH_DATA[level] || DEPTH_DATA[1];

  // Background and mood themes according to cognitive level
  const getThemeByLevel = (lvl: number) => {
    switch (lvl) {
      case 1:
        return {
          bg: 'bg-gradient-to-br from-[#f0f8ff] via-[#e2f0fb] to-[#d6ebfa]',
          badge: 'bg-[#0284c7]/15 text-[#0369a1] border-[#0284c7]/30',
          accent: '#0284c7',
        };
      case 2:
        return {
          bg: 'bg-gradient-to-br from-[#e6f8ff] via-[#cbf0ff] to-[#b3e5fc]',
          badge: 'bg-[#06b6d4]/15 text-[#0e7490] border-[#06b6d4]/30',
          accent: '#06b6d4',
        };
      case 3:
        return {
          bg: 'bg-gradient-to-br from-[#e0edff] via-[#cadcff] to-[#b0cbff]',
          badge: 'bg-[#2563eb]/15 text-[#1d4ed8] border-[#2563eb]/30',
          accent: '#2563eb',
        };
      case 4:
      default:
        return {
          bg: 'bg-gradient-to-br from-[#eef9ff] via-[#e0f7ef] to-[#fef9c3]/70',
          badge: 'bg-[#16a34a]/15 text-[#15803d] border-[#16a34a]/30',
          accent: '#16a34a',
        };
    }
  };

  const theme = getThemeByLevel(level);

  return (
    <section
      id="depth"
      ref={containerRef}
      className="relative h-[280vh] sm:h-[300vh] bg-transparent"
    >
      {/* Sticky Full-Viewport Stage */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-4 sm:mb-6 shrink-0">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08] text-[#0b0b0d]">
              How deep should the learning go?
            </h2>
          </motion.div>
        </div>

        {/* Main Interactive Levels Card (Unified Frame) */}
        <div className={`rounded-3xl border border-[#0b0b0d]/10 shadow-[0_32px_64px_-12px_rgba(11,11,13,0.12)] overflow-y-auto overflow-x-hidden flex flex-col lg:flex-row flex-1 min-h-0 relative transition-colors duration-700 ${theme.bg}`}>
          
          {/* Top Cognitive State Badge & Nav (Absolute over the unified card) */}
          <div className="absolute top-0 left-0 right-0 z-30 p-4 sm:p-5 lg:p-6 flex items-center justify-between">
            <span
              className={`text-[10px] sm:text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full backdrop-blur-md border shadow-sm ${theme.badge}`}
            >
              LEVEL 0{level} STATE
            </span>

            {/* Mini Step Track Indicators */}
            <div className="flex items-center gap-1.5 bg-white/40 backdrop-blur-md p-1.5 rounded-full border border-black/5 shadow-xs">
              {([1, 2, 3, 4] as const).map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => handleLevelSelect(step)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    level === step
                      ? 'w-8 bg-[#0b0b0d]'
                      : level > step
                      ? 'w-3 bg-[#0b0b0d]/50 hover:bg-[#0b0b0d]/80'
                      : 'w-3 bg-[#0b0b0d]/20 hover:bg-[#0b0b0d]/50'
                  }`}
                  aria-label={`Go to Level ${step}`}
                />
              ))}
            </div>
          </div>

          {/* Background Grid Pattern spanning the whole card */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {/* Left Visual Stage (Now fills left side seamlessly) */}
          <div className="flex-1 relative flex flex-col items-center justify-center pt-20 pb-8 px-4 lg:w-[55%]">
            
            {/* Central Animated Illustration */}
            <div className="relative z-10 flex items-center justify-center w-full mt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={level}
                  initial={{ opacity: 0, scale: 0.94, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.96, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full flex justify-center"
                >
                  <LearnerIllustration level={level} />
                </motion.div>
              </AnimatePresence>
            </div>


          </div>

          {/* Right Info Panel (Glassmorphic layered card over the background) */}
          <div className="w-full lg:w-[45%] p-4 sm:p-6 lg:p-8 flex flex-col justify-center relative z-20">
            <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[24px] p-6 sm:p-8 lg:p-10 h-full flex flex-col justify-center relative overflow-hidden">
              
              {/* Inner subtle glow for the glass card */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />

              <div className="relative z-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={level}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <h3 className="text-2xl sm:text-3xl font-black text-[#0b0b0d] tracking-tight leading-tight">
                      {current.title}
                    </h3>

                    <p className="text-sm text-[#4a4952] mt-3 mb-6 leading-relaxed font-medium">
                      {current.text}
                    </p>

                    {/* Included Learning Components */}
                    <div className="mb-6">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#0b0b0d]/50 block mb-2.5">
                        Included Learning Components:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {current.pills.map((pill) => (
                          <span
                            key={pill}
                            className="px-3 py-1.5 rounded-full bg-white/90 text-[#0b0b0d] font-bold text-[11px] shadow-sm border border-black/5"
                          >
                            {pill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Ideal Business Use Cases */}
                    <div className="p-4 rounded-2xl bg-[#0b0b0d]/5 border border-[#0b0b0d]/10 backdrop-blur-sm">
                      <span className="text-[10px] font-black tracking-wider uppercase text-[#0b0b0d] block mb-2">
                        🏆 Ideal Business Use Cases:
                      </span>
                      <p className="text-xs text-[#0b0b0d]/80 leading-relaxed font-semibold">
                        {current.best}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Bottom Callout */}
                <div className="mt-8 pt-4 border-t border-[#0b0b0d]/10 flex items-center justify-end">
                  <a
                    href="#contact"
                    className="text-[#0b0b0d] hover:text-[#0b0b0d] font-black inline-flex items-center gap-1.5 text-xs transition-colors group"
                  >
                    <span>Get L{level} Spec</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
