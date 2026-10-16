import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowUpRight, Building2, CheckCircle2, GraduationCap, Mail, MessageCircle, Phone } from 'lucide-react';
import { CONTACT_EMAIL, CONTACT_PHONES, whatsappUrl } from '../../../src/data/siteContact';

const formatDirectPhone = (number: string) => `+91 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
import { submitEnquiry } from '../../../src/data/submitEnquiry';

type ContactPath = 'organisation' | 'trainer';
type ContactValues = Record<string, string>;

export default function ContactSection() {
  const [path, setPath] = useState<ContactPath>('organisation');
  const [organisationValues, setOrganisationValues] = useState<ContactValues>({});
  const [trainerValues, setTrainerValues] = useState<ContactValues>({});
  const [draftUrl, setDraftUrl] = useState('');
  const [draftChannel, setDraftChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [savedReference, setSavedReference] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submissionId = useRef<string | null>(null);
  const values = path === 'organisation' ? organisationValues : trainerValues;

  const updateField = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.currentTarget;
    const update = path === 'organisation' ? setOrganisationValues : setTrainerValues;
    update((current) => ({ ...current, [name]: value }));
    setDraftUrl('');
    setSavedReference('');
    setSubmissionError('');
    submissionId.current = null;
  };

  const choosePath = (next: ContactPath) => {
    setPath(next);
    setDraftUrl('');
    setSavedReference('');
    setSubmissionError('');
    submissionId.current = null;
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const channel = submitter?.value === 'email' || submitter?.value === 'whatsapp' ? submitter.value : 'submit';
    const form = new FormData(event.currentTarget);
    const read = (name: string) => String(form.get(name) || '').trim();
    const lines = path === 'organisation'
      ? [
          'Hello TechnoEdge, I would like to discuss a solution for my organisation.',
          `Interest: ${read('service')}`,
          `Name: ${read('name')}`,
          `Organisation: ${read('company')}`,
          `Work email: ${read('email')}`,
          ...(read('phone') ? [`Phone: ${read('phone')}`] : []),
          `Goal: ${read('message')}`,
        ]
      : [
          'Hello TechnoEdge, I would like to join your trainer network.',
          `Name: ${read('name')}`,
          `Email: ${read('email')}`,
          `Expertise: ${read('expertise')}`,
          ...(read('experience') ? [`Experience: ${read('experience')}`] : []),
          ...(read('profile') ? [`Profile: ${read('profile')}`] : []),
          `What I teach: ${read('message')}`,
        ];
    const subject = path === 'organisation'
      ? `TechnoEdge enquiry — ${read('service')}`
      : `TechnoEdge trainer application — ${read('name')}`;
    const url = channel === 'email'
      ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`
      : channel === 'whatsapp' ? whatsappUrl(CONTACT_PHONES[0], lines.join('\n')) : '';
    submissionId.current ??= crypto.randomUUID();
    setSubmitting(true);
    setSubmissionError('');
    let reference: string;
    try {
      reference = await submitEnquiry({
        submissionId: submissionId.current,
        kind: path,
        name: read('name'),
        email: read('email'),
        phone: read('phone'),
        company: read('company'),
        service: read('service'),
        notes: read('message'),
        preferredChannel: channel === 'submit' ? undefined : channel,
        trainerExpertise: read('expertise'),
        trainerExperience: read('experience'),
        profileUrl: read('profile'),
        sourcePage: window.location.pathname,
        ctaId: `home_contact_${path}_${channel}`,
      });
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Your details could not be saved. Please try again.');
      setSubmitting(false);
      return;
    }
    setSavedReference(reference);
    setDraftUrl(url);
    if (channel !== 'submit') setDraftChannel(channel);
    setSubmitting(false);
    if (channel === 'email') {
      window.location.assign(url);
    } else if (channel === 'whatsapp') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section className="contact-redesign section" id="contact" aria-labelledby="contact-heading">
      <div className="contact-shell">
        <div className="contact-story">
          <div className="contact-story-main">
            <span className="contact-kicker">LET'S BUILD CAPABILITY</span>
            <h2 id="contact-heading"><em>Let’s Build</em><br />What Your Team Needs Next.</h2>
            <p>Start with the goal. We can help you explore the right training, digital learning, or AI support.</p>
            <div className="contact-scope" aria-label="What we can discuss">
              <span>Corporate Training</span>
              <span>Digital Learning</span>
              <span>Data &amp; AI</span>
            </div>
          </div>
          <div className="contact-direct">
            <span>Prefer a direct conversation?</span>
            <div>
              {CONTACT_PHONES.map((phone) => (
                <a href={`tel:${phone.e164}`} key={phone.number}><Phone size={17} aria-hidden="true" /> {formatDirectPhone(phone.number)} <ArrowUpRight size={15} aria-hidden="true" /></a>
              ))}
            </div>
          </div>
        </div>

        <div className="contact-panel">
          <header className="contact-panel-intro">
            <span>START A CONVERSATION</span>
            <h3>{path === 'organisation' ? 'Tell us what you want to build.' : 'Teach with TechnoEdge.'}</h3>
          </header>

          <fieldset className="contact-paths">
            <legend>What brings you here?</legend>
            <label className="contact-path-option">
              <input type="radio" name="contact-path" value="organisation" checked={path === 'organisation'} onChange={() => choosePath('organisation')} />
              <span className="contact-path-card"><Building2 size={23} strokeWidth={1.8} aria-hidden="true" /><strong>For my organisation</strong><small>Training, learning &amp; AI support</small></span>
            </label>
            <label className="contact-path-option">
              <input type="radio" name="contact-path" value="trainer" checked={path === 'trainer'} onChange={() => choosePath('trainer')} />
              <span className="contact-path-card"><GraduationCap size={24} strokeWidth={1.8} aria-hidden="true" /><strong>I'm a trainer</strong><small>Join our expert network</small></span>
            </label>
          </fieldset>

          <form className="contact-form" id="enquiry-form" onSubmit={handleContactSubmit}>
            {path === 'organisation' ? (
              <div className="contact-form-grid">
                <label className="contact-field contact-field-wide"><span>What can we help with? <b>*</b></span><select name="service" value={values.service || ''} onChange={updateField} required><option value="">Select a service</option><option>Corporate Training Solution</option><option>E-Learning Solution</option><option>AI &amp; Automation Consulting</option><option>Content Processing &amp; Language Services</option><option>Data &amp; AI Support</option></select></label>
                <label className="contact-field"><span>Your name <b>*</b></span><input name="name" value={values.name || ''} onChange={updateField} autoComplete="name" required /></label>
                <label className="contact-field"><span>Work email <b>*</b></span><input name="email" type="email" value={values.email || ''} onChange={updateField} autoComplete="email" required /></label>
                <label className="contact-field"><span>Organisation <b>*</b></span><input name="company" value={values.company || ''} onChange={updateField} autoComplete="organization" required /></label>
                <label className="contact-field"><span>Phone <em>(optional)</em></span><input name="phone" type="tel" value={values.phone || ''} onChange={updateField} autoComplete="tel" /></label>
                <label className="contact-field contact-field-wide"><span>What would you like to achieve? <b>*</b></span><textarea name="message" rows={4} value={values.message || ''} onChange={updateField} placeholder="Tell us about the team, challenge, or outcome." required /></label>
              </div>
            ) : (
              <div className="contact-form-grid">
                <label className="contact-field"><span>Your name <b>*</b></span><input name="name" value={values.name || ''} onChange={updateField} autoComplete="name" required /></label>
                <label className="contact-field"><span>Email <b>*</b></span><input name="email" type="email" value={values.email || ''} onChange={updateField} autoComplete="email" required /></label>
                <label className="contact-field"><span>Primary expertise <b>*</b></span><select name="expertise" value={values.expertise || ''} onChange={updateField} required><option value="">Select your area</option><option>Cloud &amp; DevOps</option><option>Data &amp; AI</option><option>Cybersecurity</option><option>Business Applications</option><option>Corporate Skills</option><option>Other</option></select></label>
                <label className="contact-field"><span>Training experience <em>(optional)</em></span><select name="experience" value={values.experience || ''} onChange={updateField}><option value="">Select years</option><option>0–2 years</option><option>3–5 years</option><option>6–10 years</option><option>10+ years</option></select></label>
                <label className="contact-field contact-field-wide"><span>LinkedIn or portfolio <em>(optional)</em></span><input name="profile" type="url" value={values.profile || ''} onChange={updateField} placeholder="https://" /></label>
                <label className="contact-field contact-field-wide"><span>What subjects and formats do you teach? <b>*</b></span><textarea name="message" rows={4} value={values.message || ''} onChange={updateField} placeholder="Share your topics, audiences, and teaching approach." required /></label>
              </div>
            )}
            <div className="contact-actions">
              <button className="contact-submit contact-submit-direct" type="submit" name="contact-channel" value="submit" disabled={submitting}><span><CheckCircle2 size={19} aria-hidden="true" />{submitting ? 'Submitting…' : path === 'organisation' ? 'Submit enquiry' : 'Submit trainer application'}</span><ArrowUpRight size={20} aria-hidden="true" /></button>
              <button className="contact-submit contact-submit-whatsapp" type="submit" name="contact-channel" value="whatsapp" disabled={submitting}><span><MessageCircle size={18} aria-hidden="true" />{submitting ? 'Saving details…' : path === 'organisation' ? 'Review enquiry on WhatsApp' : 'Review application on WhatsApp'}</span><ArrowUpRight size={20} aria-hidden="true" /></button>
              <button className="contact-submit contact-submit-email" type="submit" name="contact-channel" value="email" disabled={submitting}><span><Mail size={18} aria-hidden="true" />{submitting ? 'Saving details…' : path === 'organisation' ? 'Review enquiry by email' : 'Review application by email'}</span><ArrowUpRight size={20} aria-hidden="true" /></button>
            </div>
            {submissionError && <p className="contact-draft-status" role="alert">{submissionError}</p>}
            {savedReference && <p className="contact-draft-status" role="status">{path === 'organisation' ? 'Enquiry' : 'Trainer application'} saved successfully. Your reference is <strong>{savedReference}</strong>. {draftUrl && <>If the draft did not open, <a href={draftUrl} {...(draftChannel === 'whatsapp' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>open it in {draftChannel === 'email' ? 'your email app' : 'WhatsApp'}</a>.</>}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
