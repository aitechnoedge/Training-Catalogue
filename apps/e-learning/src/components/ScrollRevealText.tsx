import { useRef } from 'react';
import { motion, useInView, type Variants } from 'motion/react';

// ----------------------------------------------------
// 1. FADE IN UP EFFECT (For Hero Hook)
// ----------------------------------------------------
interface FadeInUpTextProps {
  lines: Array<{
    text: string;
    className?: string;
    isGradient?: boolean;
    delay?: number;
    wordByWord?: boolean;
  }>;
  className?: string;
  delay?: number;
}

export function FadeInUpText({ lines, className = '', delay = 0.1 }: FadeInUpTextProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.18,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.h1
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {lines.map((line, idx) => {
        if (line.wordByWord) {
          const words = line.text.split(' ');
          const baseDelay = line.delay !== undefined ? line.delay : idx * 0.18;

          return (
            <motion.span
              key={idx}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 1 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.11,
                    delayChildren: baseDelay,
                  },
                },
              }}
              className={`block ${line.className || ''}`}
            >
              {words.map((word, wIdx) => (
                <motion.span
                  key={wIdx}
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 24,
                      filter: 'blur(4px)',
                      scale: 0.92,
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                      filter: 'blur(0px)',
                      scale: 1,
                      transition: {
                        duration: 0.55,
                        ease: [0.22, 1, 0.36, 1],
                      },
                    },
                  }}
                  className="inline-block mr-[0.26em] last:mr-0 transform-gpu"
                >
                  {word}
                </motion.span>
              ))}
            </motion.span>
          );
        }

        return (
          <motion.span
            key={idx}
            variants={{
              hidden: {
                opacity: 0,
                y: 28,
                filter: 'blur(4px)',
              },
              visible: {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                transition: {
                  duration: 0.85,
                  delay: line.delay !== undefined ? line.delay : idx * 0.18,
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }}
            className={`block ${line.className || ''}`}
          >
            {line.text}
          </motion.span>
        );
      })}
    </motion.h1>
  );
}

// ----------------------------------------------------
// 2. MASKED LINES EFFECT (For Footer End Hook)
// Re-triggers every time the user scrolls down into view (once: false)
// ----------------------------------------------------
interface MaskedLinesTextProps {
  lines: Array<{
    text: string;
    className?: string;
    isGradient?: boolean;
  }>;
  className?: string;
  lineClassName?: string;
}

export function MaskedLinesText({
  lines,
  className = '',
  lineClassName = '',
}: MaskedLinesTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // once: false ensures the animation triggers every time user scrolls past
  const isInView = useInView(containerRef, {
    once: false,
    amount: 0.25,
    margin: '0px 0px -8% 0px',
  });

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.14,
        delayChildren: 0.05,
      },
    },
  };

  const lineVariants: Variants = {
    hidden: {
      y: '120%',
      opacity: 0,
      rotateX: -10,
      transition: {
        duration: 0.4,
        ease: [0.32, 0, 0.67, 0],
      },
    },
    visible: {
      y: '0%',
      opacity: 1,
      rotateX: 0,
      transition: {
        duration: 0.85,
        ease: [0.16, 1, 0.3, 1], // Framer-style springy snappy curve
      },
    },
  };

  return (
    <motion.div
      ref={containerRef}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {lines.map((line, idx) => (
        <div
          key={idx}
          className="overflow-hidden py-2 -my-2 will-change-transform perspective-[800px]"
        >
          <motion.div
            variants={lineVariants}
            className={`block transform-gpu ${lineClassName} ${line.className || ''}`}
          >
            {line.text}
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
}
