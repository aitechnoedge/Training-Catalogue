import { motion, useReducedMotion } from 'motion/react';

interface GradualSpacingProps {
  text: string;
  className?: string;
  gradient?: boolean;
  tone?: 'default' | 'hero';
  delay?: number;
  slowFade?: boolean;
}

/** One accessible text label; decorative letters reveal without changing layout. */
export function GradualSpacing({ text, className = '', gradient = false, tone = 'default', delay = 0, slowFade = false }: GradualSpacingProps) {
  const reduced = useReducedMotion();
  let offset = 0;
  return (
    <motion.span
      className={`gradual-spacing ${className}`}
      aria-label={text}
      initial={reduced ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      {text.split(' ').map((word, wordIndex) => {
        const start = offset;
        offset += word.length + 1;
        return (
          <span key={wordIndex} aria-hidden="true">
            {wordIndex > 0 && ' '}
            <span className="gradual-word">
              {Array.from(word).map((char, index) => {
                const position = (start + index) / Math.max(1, text.length - 1);
                return (
                  <motion.span
                    key={index}
                    className="gradual-letter"
                    style={gradient ? { color: tone === 'hero'
                      ? (position < 0.5
                        ? `color-mix(in srgb, #343c92 ${100 - position * 200}%, #8c3b75)`
                        : `color-mix(in srgb, #8c3b75 ${200 - position * 200}%, #b95427)`)
                      : (position < 0.5
                        ? `color-mix(in srgb, #226FA7 ${100 - position * 200}%, #2D8668)`
                        : `color-mix(in srgb, #2D8668 ${200 - position * 200}%, #B78106)`) } : undefined}
                    variants={{
                      hidden: { opacity: 0, x: slowFade ? 0 : -8 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    transition={{
                      duration: reduced ? 0 : slowFade ? 0.85 : 0.4,
                      delay: reduced ? 0 : delay + (start + index) * (slowFade ? 0.065 : 0.025),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >{char}</motion.span>
                );
              })}
            </span>
          </span>
        );
      })}
    </motion.span>
  );
}
