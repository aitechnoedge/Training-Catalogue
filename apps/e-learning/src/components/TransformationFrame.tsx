import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, useTransform, type Variants } from 'motion/react';
import { CheckCircle, Search, ShieldCheck } from 'lucide-react';
import img1 from '../assets/images/same_person_lvl1.jpg';
import img2 from '../assets/images/same_person_lvl2.jpg';
import img3 from '../assets/images/same_person_lvl3.jpg';
import img4 from '../assets/images/same_person_lvl4.jpg';

const stages = [
  {
    id: 0,
    title: 'Branching Scenario',
    camImage: img1,
    status: 'Confused',
    content: (
      <div className="flex flex-col h-full bg-white text-[#0b0b0d]">
        <div className="p-4 sm:p-5 border-b border-[#0b0b0d]/10 bg-[#faf8f2]">
          <h4 className="font-black text-sm mb-1">Customer Escalation</h4>
          <p className="text-xs sm:text-sm text-[#57565d] leading-relaxed">
            "I need a refund! My shipment is 3 days late and I'm losing money!"
          </p>
        </div>
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center gap-3">
          <div className="w-full text-left p-3 rounded-xl border border-[#0b0b0d]/10 bg-white text-xs sm:text-sm font-medium text-[#57565d] shadow-sm">
            A. Cite Policy 4.2.A (No transit refunds)
          </div>
          <div className="w-full text-left p-3 rounded-xl border-2 border-[#444347] bg-[#e6faf4] text-[#0b0b0d] font-bold text-xs sm:text-sm shadow-sm flex items-center justify-between">
            <span>B. Empathize & open investigation</span>
            <div className="w-2 h-2 rounded-full bg-[#444347]" />
          </div>
        </div>
      </div>
    )
  },
  {
    id: 1,
    title: 'Knowledge Check',
    camImage: img2,
    status: 'Focusing',
    content: (
      <div className="flex flex-col h-full bg-white text-[#0b0b0d] p-4 sm:p-5">
        <h4 className="font-black text-sm mb-2">Policy Check</h4>
        <p className="text-xs sm:text-sm text-[#57565d] mb-5 leading-relaxed">
          To resolve the delay for Case #4471 without violating Policy 4.2.A, which override should you use?
        </p>
        <div className="flex-1 flex flex-col justify-end gap-3 pb-2">
          <div className="p-3 rounded-xl border border-[#0b0b0d]/10 text-xs sm:text-sm text-[#57565d] bg-gray-50">
            1. Standard Return Flow
          </div>
          <div className="p-3 rounded-xl border-2 border-[#0b0b0d] bg-[#f5f3ff] text-[#0b0b0d] font-bold text-xs sm:text-sm flex justify-between items-center shadow-sm">
            <span>2. Expedited Shipping Credit</span>
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: 'Software Simulation',
    camImage: img3,
    status: 'Practicing',
    content: (
      <div className="flex flex-col h-full bg-[#111217] text-white p-4 sm:p-5 font-mono">
        <div className="flex items-center gap-2 mb-5 border-b border-white/10 pb-3">
          <Search className="w-4 h-4 text-[#ffffff]" />
          <span className="text-xs sm:text-sm font-bold text-[#ffffff]">Refund Override — Case #4471</span>
        </div>
        <div className="space-y-4 mt-auto pb-2">
          <div>
            <label className="text-[10px] sm:text-xs text-white/50 block mb-1.5 font-sans tracking-wide">AUTHORIZATION CODE</label>
            <div className="border border-white/20 bg-white/5 rounded-lg p-2.5 text-xs sm:text-sm text-white flex items-center">
              ESC-99<span className="w-1.5 h-4 bg-[#0b0b0d] animate-pulse ml-1 inline-block" />
            </div>
          </div>
          <button className="w-full bg-[#0b0b0d] text-white font-bold text-xs sm:text-sm py-2.5 rounded-lg shadow-[0_0_15px_rgba(117,87,255,0.4)] hover:bg-[#6344eb] transition-colors cursor-default">
            APPLY OVERRIDE
          </button>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: 'Certification',
    camImage: img4,
    status: 'Confident',
    content: (
      <div className="flex flex-col h-full bg-gradient-to-br from-[#0b0b0d] to-[#0b0b0d] text-white p-4 sm:p-5 items-center justify-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#444347]/20 rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2" />
        
        <ShieldCheck className="w-12 h-12 sm:w-16 sm:h-16 text-[#ffffff] mb-4 relative z-10" />
        <h4 className="font-black text-lg sm:text-xl mb-2 relative z-10">Case Resolved</h4>
        <p className="text-xs sm:text-sm text-white/90 font-medium relative z-10 leading-relaxed">
          Escalation & Refund Protocol Mastered.
        </p>
        <div className="mt-5 px-4 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase relative z-10 shadow-lg">
          Policy 4.2.A Certified
        </div>
      </div>
    )
  }
];

export function TransformationFrame() {
  const [activeStage, setActiveStage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Mouse Parallax values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 20, stiffness: 100, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Glow (Moves opposite to cursor, slowly)
  const glowX = useTransform(smoothX, v => v * -0.05);
  const glowY = useTransform(smoothY, v => v * -0.05);
  
  // Frame (Magnetic pull if close, else subtle follow)
  const frameX = useTransform(smoothX, v => v);
  const frameY = useTransform(smoothY, v => v);
  
  // Cam (Magnetic pull faster, else subtle follow faster)
  const camX = useTransform(smoothX, v => v * 1.5);
  const camY = useTransform(smoothY, v => v * 1.5);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    setIsTouch(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || isTouch) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    // Magnetic zone (~40px padding around frame)
    const isNear = 
      e.clientX > rect.left - 40 && e.clientX < rect.right + 40 &&
      e.clientY > rect.top - 40 && e.clientY < rect.bottom + 40;

    if (isNear) {
      mouseX.set(deltaX * 0.1); // Pull towards cursor
      mouseY.set(deltaY * 0.1);
    } else {
      mouseX.set(deltaX * 0.02); // Subtle parallax
      mouseY.set(deltaY * 0.02);
    }
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    if (prefersReducedMotion || isTouch) return;
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleAnimationEnd = (e: React.AnimationEvent, index: number) => {
    if (e.animationName === 'storyFill' && index === activeStage) {
      setActiveStage((prev) => (prev + 1) % stages.length);
    }
  };

  const stageVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      filter: prefersReducedMotion ? 'none' : [
        'drop-shadow(0px 0px 0px rgba(117,87,255,0))',
        'drop-shadow(-4px 0px 0px rgba(255,95,159,0.8)) drop-shadow(4px 0px 0px rgba(52,216,178,0.8))',
        'drop-shadow(4px 0px 0px rgba(117,87,255,0.8)) drop-shadow(-4px 0px 0px rgba(255,95,159,0.8))',
        'drop-shadow(0px 0px 0px rgba(117,87,255,0))'
      ],
      x: prefersReducedMotion ? 0 : [0, -3, 3, -2, 2, 0],
      transition: { duration: prefersReducedMotion ? 0.1 : 0.25, ease: "easeInOut" }
    },
    exit: { opacity: 0, zIndex: -1, transition: { duration: 0.1 } }
  };

  return (
    <>
      <style>{`
        @keyframes storyFill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>

      <div 
        className="relative w-full flex items-center justify-center p-4 sm:p-8"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerEnter={() => setIsHovered(true)}
      >
        {/* Ambient Radial Glow Backdrop */}
        <motion.div 
          style={{ x: glowX, y: glowY }}
          className="absolute w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-gradient-to-tr from-[#0b0b0d]/20 via-[#0b0b0d]/15 to-[#444347]/20 blur-3xl pointer-events-none -z-10" 
        />

        <div className="relative w-full max-w-[440px] aspect-[4/3] group" ref={containerRef}>
          {/* Main Frame */}
          <motion.div 
            style={{ x: frameX, y: frameY, rotate: 2 }}
            className="w-full h-full rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#0b0b0d]/10 relative z-10 flex flex-col"
          >
            {/* Browser Chrome */}
            <div className="h-8 bg-[#f3f0e8] border-b border-[#0b0b0d]/10 flex items-center px-3 gap-1.5 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0b0b0d]/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffffff]/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#444347]/60" />
            </div>
            
            {/* Stage Content */}
            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={activeStage}
                  className="absolute inset-0 bg-white"
                  variants={stageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {stages[activeStage].content}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Floating Learner Cam */}
          <motion.div 
            style={{ x: camX, y: camY }}
            className="absolute -bottom-6 -right-6 z-20 flex flex-col items-center"
          >
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white relative">
              <AnimatePresence mode="popLayout">
                <motion.img 
                  key={activeStage}
                  src={stages[activeStage].camImage}
                  alt="Learner state"
                  className="absolute inset-0 w-full h-full object-cover"
                  variants={stageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                />
              </AnimatePresence>
            </div>
            {/* Status Label with Kinetic Reveal */}
            <div className="mt-2 px-3 py-1 bg-white rounded-full shadow-lg border border-[#0b0b0d]/10 text-xs font-bold text-[#0b0b0d] overflow-hidden whitespace-nowrap min-w-[80px] text-center">
              <AnimatePresence mode="popLayout">
                <motion.span 
                  key={stages[activeStage].status}
                  initial={{ clipPath: 'inset(0 100% 0 0)' }}
                  animate={{ clipPath: 'inset(0 0% 0 0)' }}
                  exit={{ opacity: 0, position: 'absolute' }}
                  transition={{ duration: 0.3, delay: prefersReducedMotion ? 0 : 0.15, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-[#0b0b0d] to-[#0b0b0d] bg-clip-text text-transparent inline-block w-full text-center"
                >
                  {stages[activeStage].status}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Story Progress Bars */}
          <div 
            role="tablist" 
            aria-label="Story progress"
            className="absolute -bottom-10 sm:-bottom-12 left-0 w-3/4 flex gap-2 h-1.5 z-10"
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
          >
            {stages.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={activeStage === i}
                aria-label={`Jump to stage ${i + 1}`}
                onClick={() => setActiveStage(i)}
                className="flex-1 rounded-full bg-[#0b0b0d]/10 overflow-hidden cursor-pointer relative transition-transform hover:scale-y-150 outline-none focus-visible:ring-2 focus-visible:ring-[#0b0b0d]"
              >
                <div 
                  onAnimationEnd={(e) => handleAnimationEnd(e, i)}
                  className="absolute inset-0 bg-gradient-to-r from-[#0b0b0d] to-[#0b0b0d] origin-left"
                  style={{
                    width: i < activeStage ? '100%' : i > activeStage ? '0%' : '100%',
                    animationName: i === activeStage ? 'storyFill' : 'none',
                    animationDuration: '3.5s',
                    animationTimingFunction: 'linear',
                    animationFillMode: 'forwards',
                    animationPlayState: isHovered ? 'paused' : 'running'
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
