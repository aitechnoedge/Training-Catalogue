import { Fragment } from 'react';
import {
  BadgeCheck,
  BookOpen,
  Box,
  Check,
  CircleDot,
  Gamepad2,
  GitBranch,
  Glasses,
  Grip,
  ListChecks,
  MessageCircleReply,
  MonitorCog,
  MousePointerClick,
  Palette,
  PlaySquare,
  Sparkles,
  Volume2,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import './level-comparison.css';

type StatusKind = 'included' | 'graded' | 'optional' | 'excluded';
type MatrixValue = { label: string; kind: StatusKind };
type FeatureRow = {
  feature: string;
  note: string;
  Icon: LucideIcon;
  levels: [MatrixValue, MatrixValue, MatrixValue, MatrixValue];
};

const included = (label = 'Included'): MatrixValue => ({ label, kind: 'included' });
const graded = (label: string): MatrixValue => ({ label, kind: 'graded' });
const optional = (label = 'Optional'): MatrixValue => ({ label, kind: 'optional' });
const excluded = (label = 'Not typical'): MatrixValue => ({ label, kind: 'excluded' });

const LEVELS = [
  { number: '01', name: 'Explain', sub: 'Clear and essential', Icon: BookOpen },
  { number: '02', name: 'Practice', sub: 'Guided interaction', Icon: MousePointerClick },
  { number: '03', name: 'Decide', sub: 'Choices and outcomes', Icon: GitBranch },
  { number: '04', name: 'Immerse', sub: '3D and spatial practice', Icon: Box },
];

const BEST_FOR = [
  'Awareness & explanation',
  'Practice & application',
  'Judgement & decision-making',
  'Simulation & immersion',
];

const GROUPS: Record<number, string> = {
  0: 'FOUNDATION',
  3: 'INTERACTION',
  8: 'DECISION & PRACTICE',
  14: 'IMMERSIVE TECHNOLOGY',
};

const FEATURES: FeatureRow[] = [
  { feature: 'Brand styling', note: 'Your visual system and course identity', Icon: Palette, levels: [included(), included(), included(), included()] },
  { feature: 'Navigation controls', note: 'Play, pause, next, back and menu', Icon: MousePointerClick, levels: [included('Basic'), included('Enhanced'), included('Custom'), included('Spatial')] },
  { feature: 'SCORM + xAPI tracking', note: 'Completion, score and learner activity', Icon: BadgeCheck, levels: [included(), included(), included(), included()] },
  { feature: 'Voice-over', note: 'Narration matched to the experience', Icon: Volume2, levels: [optional(), graded('1 voice'), graded('2+ voices'), graded('Custom cast')] },
  { feature: 'Video and animation', note: 'Motion used to explain and demonstrate', Icon: PlaySquare, levels: [graded('Simple'), graded('Enhanced'), graded('Advanced'), graded('3D / cinematic')] },
  { feature: 'Knowledge checks', note: 'Questions that reinforce understanding', Icon: ListChecks, levels: [optional('Optional quiz'), included('Included'), graded('Scenario-based'), graded('Performance-based')] },
  { feature: 'Click-reveal and hotspots', note: 'Explore information in context', Icon: CircleDot, levels: [graded('Basic'), included('Guided'), graded('Advanced'), graded('3D hotspots')] },
  { feature: 'Drag, drop and matching', note: 'Apply knowledge through an action', Icon: Grip, levels: [excluded(), included(), graded('Custom'), graded('Spatial tasks')] },
  { feature: 'Scenario-based learning', note: 'Learn through a realistic situation', Icon: MessageCircleReply, levels: [excluded(), graded('Guided'), included('Multi-step'), included('Immersive')] },
  { feature: 'Branching paths', note: 'Choices change what happens next', Icon: GitBranch, levels: [excluded(), excluded('Single path'), included('Multi-path'), graded('World responds')] },
  { feature: 'Feedback and consequences', note: 'Explain the effect of each action', Icon: MessageCircleReply, levels: [graded('Basic'), included('Immediate'), graded('Visible outcomes'), graded('Real-time')] },
  { feature: 'Gamification', note: 'Purposeful progress, challenge and reward', Icon: Gamepad2, levels: [excluded(), graded('Light'), graded('Points + missions'), included('Rich systems')] },
  { feature: 'Software or process simulation', note: 'Practice a task safely', Icon: MonitorCog, levels: [excluded(), optional('Guided demo'), included('Interactive'), graded('Full environment')] },
  { feature: 'Custom interactions', note: 'Interactions designed around the task', Icon: Sparkles, levels: [excluded(), graded('Limited'), included('Advanced'), graded('Premium')] },
  { feature: '3D and 360° environments', note: 'Look around and act inside the scene', Icon: Box, levels: [excluded(), excluded(), optional('Optional'), included()] },
  { feature: 'AR and VR delivery', note: 'Headset or device-based immersion', Icon: Glasses, levels: [excluded(), excluded(), excluded(), optional('Project option')] },
];

function StatusMark({ value, level }: { value: MatrixValue; level: number }) {
  const Icon = value.kind === 'included' ? Check : value.kind === 'excluded' ? X : value.kind === 'optional' ? Sparkles : CircleDot;
  return (
    <span className={`matrix-status matrix-status--${value.kind}`} data-level={level}>
      <span className="matrix-status__coin" aria-hidden="true"><Icon /></span>
      <span>{value.label}</span>
    </span>
  );
}

export function LevelComparisonMatrix() {
  const reduced = useReducedMotion();
  return (
    <section className="level-matrix-section" id="depth" aria-labelledby="level-matrix-title">
      <motion.div
        className="level-matrix-shell"
        initial={reduced ? false : { opacity: 0, y: 28 }}
        whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="level-matrix-intro">
          <div>
            <span className="level-matrix-kicker">THE FOUR LEARNING LEVELS</span>
            <h2 id="level-matrix-title">
              <span>See Exactly What Changes</span>
              <em>At Each Level.</em>
            </h2>
          </div>
        </header>

        <p className="level-matrix-swipe-hint">Swipe or scroll sideways to compare every level.</p>
        <div className="level-matrix-scroll" role="region" aria-label="Learning level feature comparison" tabIndex={0}>
          <table className="level-matrix-table">
            <thead>
              <tr>
                <th scope="col" className="matrix-feature-heading">
                  <span>FEATURES</span>
                  <small>What we can build</small>
                </th>
                {LEVELS.map(({ number, name, sub, Icon }, index) => (
                  <th scope="col" key={number} className={`matrix-level-heading matrix-level-heading--${index + 1}`}>
                    <span className="matrix-level-icon" aria-hidden="true"><Icon /></span>
                    <small>LEVEL {number}</small>
                    <strong>{name}</strong>
                    <em>{sub}</em>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="matrix-best-fit-row">
                <th scope="row">
                  <div className="matrix-feature-content">
                    <span className="matrix-feature-icon" aria-hidden="true"><Users /></span>
                    <span><strong>Best suited for</strong></span>
                  </div>
                </th>
                {BEST_FOR.map((label, index) => <td key={label} data-level={index + 1}>{label}</td>)}
              </tr>
              {FEATURES.map(({ feature, note, Icon }, rowIndex) => (
                <Fragment key={feature}>
                  {GROUPS[rowIndex] && (
                    <tr className="matrix-group-row">
                      <th colSpan={5}>{GROUPS[rowIndex]}</th>
                    </tr>
                  )}
                  <tr className="matrix-data-row">
                    <th scope="row">
                      <div className="matrix-feature-content">
                        <span className="matrix-feature-icon" aria-hidden="true"><Icon /></span>
                        <span><strong>{feature}</strong><small>{note}</small></span>
                      </div>
                    </th>
                    {FEATURES[rowIndex].levels.map((value, levelIndex) => (
                      <td key={`${feature}-${levelIndex}`}><StatusMark value={value} level={levelIndex + 1} /></td>
                    ))}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

      </motion.div>
    </section>
  );
}
