import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { LearningEngineOrbit } from './LearningEngineOrbit';

interface HeroProps {
  onOpenScoper: () => void;
}

export function Hero({ onOpenScoper }: HeroProps) {
  const prefersReducedMotion = useReducedMotion();

  // Entrance choreography variants
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2, // Let the mask open a bit first
      },
    },
  };

  const maskVariants: Variants = {
    hidden: { clipPath: 'circle(0% at 50% 50%)' },
    visible: {
      clipPath: 'circle(150% at 50% 50%)',
      transition: { duration: 1.2, ease: [0.65, 0, 0.15, 1] },
    },
  };

  const lineVariants: Variants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(5px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(5px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const frameVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9, y: 60 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 70,
        damping: 20,
        mass: 1.2,
      },
    },
  };

  return (
    <div className="relative w-full bg-[#f6f3eb] overflow-hidden">
      {/* Static grain/noise overlay behind everything */}
      <div 
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.04]" 
        style={{ backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48ZmlsdGVyIGlkPSJub2lzZUZpbHRlciI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2VGaWx0ZXIpIi8+PC9zdmc+")` }}
      ></div>

      <motion.section 
        variants={prefersReducedMotion ? {} : maskVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full min-h-[95vh] pt-32 pb-20 flex items-center z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none z-[1]"></div>

        <motion.div
          variants={prefersReducedMotion ? {} : containerVariants}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full"
        >
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Text & CTAs */}
            <motion.div className="flex flex-col items-start text-left relative z-10">
              <h1 className="text-4xl sm:text-5xl lg:text-[4.5rem] font-extrabold tracking-tight leading-[1.05] mb-6 text-[#0b0b0d]">
                <motion.span variants={prefersReducedMotion ? {} : lineVariants} className="block pb-1">
                  We don't just create courses.
                </motion.span>
                <motion.span variants={prefersReducedMotion ? {} : lineVariants} className="block bg-gradient-to-r from-[#7557ff] via-[#ff5f9f] to-[#ff925b] bg-clip-text text-transparent drop-shadow-sm pb-2 mt-2">
                  We make people want to learn.
                </motion.span>
              </h1>

              <motion.p
                variants={prefersReducedMotion ? {} : fadeUpVariants}
                className="text-sm sm:text-base md:text-lg leading-relaxed text-[#444347] max-w-xl mb-8 font-medium"
              >
                Got a dense PPT? 100-page SOP? New software rollout? Policy update? Skill gap? We turn
                it into digital learning people can watch, click, practice, play, remember, and
                actually use at work.
              </motion.p>

              <motion.div
                variants={prefersReducedMotion ? {} : fadeUpVariants}
                className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8"
              >
                <a
                  href="#universe"
                  id="hero-explore-universe"
                  className="inline-flex items-center justify-center gap-2 px-6 lg:px-8 py-3.5 lg:py-4 rounded-full text-sm font-bold bg-[#0b0b0d] text-white hover:bg-gray-800 shadow-xl shadow-[#0b0b0d]/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer whitespace-nowrap group"
                >
                  <span>Show me what's possible</span>
                  <ArrowUpRight className="w-4 h-4 text-[#dfff5c] group-hover:rotate-12 transition-transform" />
                </a>

                <button
                  type="button"
                  onClick={onOpenScoper}
                  id="hero-messy-idea"
                  className="inline-flex items-center justify-center gap-2 px-6 lg:px-8 py-3.5 lg:py-4 rounded-full text-sm font-bold bg-white text-[#0b0b0d] border border-gray-200 shadow-lg shadow-gray-200/50 hover:bg-gray-50 hover:-translate-y-1 transition-all duration-300 cursor-pointer whitespace-nowrap group"
                >
                  <Sparkles className="w-4 h-4 text-[#7557ff] group-hover:scale-110 transition-transform" />
                  <span>I have a messy idea</span>
                </button>
              </motion.div>

              {/* Microcopy Pill */}
              <motion.div
                variants={prefersReducedMotion ? {} : fadeUpVariants}
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#444347] font-medium"
              >
                <span className="bg-[#dfff5c] text-[#0b0b0d] font-bold px-2 py-0.5 rounded shrink-0 shadow-sm">
                  Plot twist:
                </span>
                <span>SCORM and compliance do not have to look like 2009.</span>
              </motion.div>
            </motion.div>

            {/* Right Column: Learning Engine Orbit */}
            <motion.div
              variants={prefersReducedMotion ? {} : frameVariants}
              className="w-full flex justify-center lg:justify-end relative z-20"
            >
              <LearningEngineOrbit />
            </motion.div>

          </div>
        </motion.div>
      </motion.section>
    </div>
  );
}
