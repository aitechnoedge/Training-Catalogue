import { useState } from 'react';
import { ArrowUpRight, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { GradualSpacing } from './GradualSpacing';
import { ELearningEnquiryModal } from './ELearningEnquiryModal';
import { CONTACT_EMAIL } from '../../../../../src/data/siteContact';

export function ContactSection() {
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  return (
    <section id="contact" className="min-h-screen py-16 sm:py-20 lg:py-24 flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p className="closing-hook mb-10 sm:mb-12 select-none" role="heading" aria-level={2} aria-label="Let’s Change the WAY PEOPLE LEARN">
        <GradualSpacing text="Let’s Change the" className="block" />
        <GradualSpacing text="WAY PEOPLE LEARN" className="block" gradient delay={0.35} slowFade />
      </p>
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="contact-panel relative rounded-[40px] bg-[#faf8f3] text-[#30283f] border p-8 sm:p-14 lg:p-16 overflow-hidden shadow-2xl min-h-[390px] flex flex-col justify-center w-full"
      >
        {/* Glow Spheres */}
        <div className="absolute -right-24 -top-24 w-[450px] h-[450px] rounded-full bg-[#b8dcff]/35 blur-[110px] pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-[350px] h-[350px] rounded-full bg-[#d4ebff]/40 blur-[100px] pointer-events-none" />

        <div className="contact-panel__layout relative z-10">
          <div className="contact-support-symbol" aria-hidden="true">
            <img
              src="/e-learning/media/pastel-neumorphic-support-avatar.png?v=20261017-3"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="contact-panel__content text-left">
            <h2 className="tracking-tight text-[#30283f] mb-4 sm:mb-6">
              <em>Not Sure Which Format Fits?</em>
              <span>Tell Us What People Need to<br className="hidden sm:block" /> Understand, Decide or Do.</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#30283f] leading-relaxed mb-8 max-w-2xl font-black">
              We&apos;ll help you choose the right experience.
            </p>

            <div className="contact-panel__actions flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setIsEnquiryOpen(true)}
                className="contact-primary-cta inline-flex items-center gap-2.5 px-6 sm:px-8 py-4 rounded-full text-base sm:text-lg font-black transition-all shadow-xl hover:-translate-y-0.5 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#226FA7]"
              >
                <span>Talk to TechnoEdge</span>
                <ArrowUpRight className="w-5 h-5 text-white" />
              </button>

              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="contact-email-cta text-sm sm:text-base font-bold transition-colors inline-flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>{CONTACT_EMAIL}</span>
              </a>
            </div>

          </div>
        </div>
      </motion.div>
      {isEnquiryOpen && <ELearningEnquiryModal onClose={() => setIsEnquiryOpen(false)} />}
    </section>
  );
}




