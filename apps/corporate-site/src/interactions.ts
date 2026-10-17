const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function mountCorporateInteractions(): () => void {
  const root = document.getElementById('corporate-site');
  if (!root) return () => undefined;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const disposers: Array<() => void> = [];
  const frameIds = new Set<number>();
  const observe = (target: EventTarget, type: string, handler: EventListener, options?: AddEventListenerOptions) => {
    target.addEventListener(type, handler, options);
    disposers.push(() => target.removeEventListener(type, handler, options));
  };
  const frame = (callback: FrameRequestCallback) => {
    const id = requestAnimationFrame((now) => {
      frameIds.delete(id);
      callback(now);
    });
    frameIds.add(id);
    return id;
  };
  document.documentElement.classList.add('motion-ready');
  disposers.push(() => document.documentElement.classList.remove('motion-ready'));

  const menu = root.querySelector<HTMLButtonElement>('.menu-toggle');
  const nav = root.querySelector<HTMLElement>('.primary-nav');
  const serviceToggle = root.querySelector<HTMLButtonElement>('.nav-drop>button');
  const serviceDrop = root.querySelector<HTMLElement>('.nav-drop');
  if (menu && nav) {
    observe(menu, 'click', () => {
      const next = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(next));
      nav.classList.toggle('open', next);
    });
    root.querySelectorAll('.primary-nav a').forEach((link) => observe(link, 'click', () => {
      menu.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
    }));
  }
  if (serviceToggle && serviceDrop) observe(serviceToggle, 'click', () => {
    const next = !serviceDrop.classList.contains('open');
    serviceDrop.classList.toggle('open', next);
    serviceToggle.setAttribute('aria-expanded', String(next));
  });

  const counters = [...root.querySelectorAll<HTMLElement>('[data-count]')];
  function animateCount(element: HTMLElement | null) {
    if (!element || element.dataset.counted === 'true') return;
    element.dataset.counted = 'true';
    const target = Number(element.dataset.count);
    if (reducedMotion) {
      element.textContent = target.toLocaleString();
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const progress = clamp((now - start) / 1300);
      element.textContent = Math.floor(target * (1 - (1 - progress) ** 3)).toLocaleString();
      if (progress < 1) frame(step);
    };
    frame(step);
  }
  if (reducedMotion) counters.forEach(animateCount);

  const revealTargets = [...root.querySelectorAll<HTMLElement>(
    '.section-title,.impact-intro,.service-card,.why-visual,.why-copy,.post-grid article,.contact-intro,.enquiry-form',
  )];
  const revealObserver = new IntersectionObserver((entries) => entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) {
      target.classList.add('in-view');
      revealObserver.unobserve(target);
    }
  }), { threshold: .14, rootMargin: '0px 0px -6%' });
  if (!reducedMotion) revealTargets.forEach((element) => {
    element.classList.add('reveal');
    const siblings = [...(element.parentElement?.children ?? [])].filter((child) => revealTargets.includes(child as HTMLElement));
    element.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(element), 4) * 90}ms`);
    revealObserver.observe(element);
  });
  disposers.push(() => revealObserver.disconnect());

  const impact = root.querySelector<HTMLElement>('.impact');
  const impactObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    counters.forEach(animateCount);
    impactObserver.disconnect();
  }, { threshold: .32 });
  if (impact && !reducedMotion) impactObserver.observe(impact);
  disposers.push(() => impactObserver.disconnect());

  const bot = root.querySelector<HTMLButtonElement>('.ai-bot-button');
  const choices = root.querySelector<HTMLElement>('.contact-choices');
  if (bot && choices) {
    const close = () => { bot.setAttribute('aria-expanded', 'false'); choices.classList.remove('open'); };
    observe(bot, 'click', () => {
      const next = bot.getAttribute('aria-expanded') !== 'true';
      bot.setAttribute('aria-expanded', String(next));
      choices.classList.toggle('open', next);
    });
    observe(document, 'click', (event) => {
      if (!(event.target as Element).closest('.ai-contact')) close();
    });
  }

  const contactSection = root.querySelector<HTMLElement>('#contact');
  if (contactSection) {
    const contactObserver = new IntersectionObserver(([entry]) => {
      root.classList.toggle('contact-in-view', entry.isIntersecting);
      if (entry.isIntersecting) {
        bot?.setAttribute('aria-expanded', 'false');
        choices?.classList.remove('open');
      }
    }, { rootMargin: '0px 0px -20% 0px' });
    contactObserver.observe(contactSection);
    disposers.push(() => { contactObserver.disconnect(); root.classList.remove('contact-in-view'); });
  }

  const whyImage = root.querySelector<HTMLImageElement>('.why-visual img');
  let parallaxFrame = 0;
  const updateParallax = () => {
    parallaxFrame = 0;
    if (!whyImage) return;
    if (reducedMotion || innerWidth <= 760) {
      whyImage.style.transform = '';
      return;
    }
    const rect = whyImage.parentElement?.getBoundingClientRect();
    if (!rect || rect.bottom < 0 || rect.top > innerHeight) return;
    const offset = Math.max(-18, Math.min(18, (innerHeight / 2 - (rect.top + rect.height / 2)) * .055));
    whyImage.style.transform = `scale(1.07) translate3d(0,${offset}px,0)`;
  };
  const requestParallax = () => { if (!parallaxFrame) parallaxFrame = frame(updateParallax); };
  observe(window, 'scroll', requestParallax, { passive: true });
  observe(window, 'resize', requestParallax);
  updateParallax();

  return () => {
    disposers.forEach((dispose) => dispose());
    frameIds.forEach((id) => cancelAnimationFrame(id));
    revealTargets.forEach((element) => element.classList.remove('reveal', 'in-view'));
    counters.forEach((element) => delete element.dataset.counted);
  };
}
