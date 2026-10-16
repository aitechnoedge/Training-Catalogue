type Layout = { x: number; y: number; w: number; max: number; layer: number };

const mediaCompositions: Layout[][] = [
  [
    { x: .43, y: .58, w: .53, max: 700, layer: 4 },
    { x: .79, y: .31, w: .32, max: 420, layer: 3 },
    { x: .78, y: .75, w: .34, max: 450, layer: 2 },
    { x: .15, y: .33, w: .26, max: 340, layer: 1 },
  ],
  [
    { x: .23, y: .36, w: .37, max: 465, layer: 4 },
    { x: .64, y: .57, w: .54, max: 720, layer: 3 },
    { x: .24, y: .79, w: .27, max: 350, layer: 2 },
    { x: .82, y: .22, w: .31, max: 410, layer: 1 },
  ],
  [
    { x: .23, y: .72, w: .35, max: 450, layer: 3 },
    { x: .55, y: .49, w: .56, max: 740, layer: 4 },
    { x: .83, y: .76, w: .28, max: 365, layer: 2 },
    { x: .15, y: .27, w: .26, max: 340, layer: 1 },
  ],
  [
    { x: .41, y: .56, w: .52, max: 700, layer: 4 },
    { x: .78, y: .28, w: .36, max: 470, layer: 3 },
    { x: .78, y: .78, w: .30, max: 390, layer: 2 },
    { x: .16, y: .43, w: .27, max: 350, layer: 1 },
  ],
  [
    { x: .25, y: .52, w: .23, max: 360, layer: 3 },
    { x: .50, y: .52, w: .23, max: 360, layer: 2 },
    { x: .75, y: .52, w: .23, max: 360, layer: 1 },
  ],
];

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => value * value * (3 - 2 * value);
const mix = (start: number, end: number, amount: number) => start + (end - start) * amount;

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

  const media = root.querySelector<HTMLElement>('.media-universe');
  const mediaWorld = root.querySelector<HTMLElement>('.media-world');
  const mediaNodes = [...root.querySelectorAll<HTMLElement>('.media-node')];
  const mediaIntro = root.querySelector<HTMLElement>('.media-universe-intro');
  const mediaDialog = root.querySelector<HTMLDialogElement>('.media-lightbox');
  const lightboxImage = mediaDialog?.querySelector<HTMLImageElement>('.media-lightbox-visual img');
  const lightboxQuote = mediaDialog?.querySelector<HTMLElement>('.media-lightbox-visual blockquote');
  const lightboxTitle = mediaDialog?.querySelector<HTMLElement>('.media-lightbox-details h3');
  const lightboxCount = mediaDialog?.querySelector<HTMLElement>('[data-media-count]');
  let openedFrom: HTMLElement | null = null;
  let galleryIndex = 0;
  let previousBodyOverflow = '';
  const mediaControl = (node: HTMLElement) => node.querySelector<HTMLButtonElement>(':scope > .media-open-control');
  const createdMediaControls: HTMLButtonElement[] = [];
  const usesStaticMediaLayout = () => innerWidth <= 1024 || reducedMotion;

  mediaNodes.forEach((node) => {
    if (mediaControl(node)) return;
    const label = node.querySelector('figcaption')?.textContent?.trim()
      || node.querySelector(':scope > span')?.textContent?.trim()
      || 'training moment';
    const control = document.createElement('button');
    control.type = 'button';
    control.className = 'media-open-control';
    control.setAttribute('aria-haspopup', 'dialog');
    control.setAttribute('aria-label', `View ${label}`);
    control.tabIndex = usesStaticMediaLayout() ? 0 : -1;
    node.append(control);
    createdMediaControls.push(control);
  });

  const showMediaSlide = (index: number) => {
    if (!mediaDialog || !lightboxImage || !lightboxQuote || !lightboxTitle || !lightboxCount) return;
    galleryIndex = (index + mediaNodes.length) % mediaNodes.length;
    const node = mediaNodes[galleryIndex];
    const sourceImage = node.querySelector<HTMLImageElement>('img');
    if (sourceImage) {
      lightboxImage.src = sourceImage.currentSrc || sourceImage.src;
      lightboxImage.alt = sourceImage.alt;
      lightboxImage.hidden = false;
      lightboxQuote.hidden = true;
      lightboxTitle.textContent = node.querySelector('figcaption')?.textContent?.trim() || 'Training moment';
    } else {
      lightboxImage.hidden = true;
      lightboxImage.removeAttribute('src');
      lightboxQuote.hidden = false;
      lightboxQuote.querySelector('span')!.textContent = node.querySelector('span')?.textContent || 'Learner voice';
      lightboxQuote.querySelector('p')!.textContent = node.querySelector('p')?.textContent || '';
      lightboxQuote.querySelector('footer')!.textContent = node.querySelector('footer')?.textContent || '';
      lightboxTitle.textContent = 'In their words';
    }
    lightboxCount.textContent = `${String(galleryIndex + 1).padStart(2, '0')} / ${String(mediaNodes.length).padStart(2, '0')}`;
  };

  const openMediaSlide = (node: HTMLElement) => {
    const control = mediaControl(node);
    if (!mediaDialog || !control || control.tabIndex < 0) return;
    openedFrom = control;
    showMediaSlide(mediaNodes.indexOf(node));
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    mediaDialog.showModal();
  };

  if (mediaWorld && mediaDialog) {
    observe(mediaWorld, 'click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const node = target.closest<HTMLElement>('.media-node');
      if (node && mediaWorld.contains(node)) openMediaSlide(node);
    });
    observe(mediaDialog, 'close', () => {
      document.body.style.overflow = previousBodyOverflow;
      if (openedFrom?.isConnected) openedFrom.focus();
      openedFrom = null;
    });
    observe(mediaDialog, 'click', (event) => {
      if (event.target === mediaDialog) mediaDialog.close();
    });
    observe(mediaDialog, 'keydown', (event) => {
      if (!(event instanceof KeyboardEvent)) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); showMediaSlide(galleryIndex - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); showMediaSlide(galleryIndex + 1); }
    });
    const close = mediaDialog.querySelector<HTMLButtonElement>('.media-lightbox-close');
    const previous = mediaDialog.querySelector<HTMLButtonElement>('[data-media-previous]');
    const next = mediaDialog.querySelector<HTMLButtonElement>('[data-media-next]');
    if (close) observe(close, 'click', () => mediaDialog.close());
    if (previous) observe(previous, 'click', () => showMediaSlide(galleryIndex - 1));
    if (next) observe(next, 'click', () => showMediaSlide(galleryIndex + 1));
    disposers.push(() => { if (mediaDialog.open) mediaDialog.close(); document.body.style.overflow = previousBodyOverflow; });
  }
  let targetProgress = 0;
  let renderedProgress = 0;
  let mediaFrame = 0;
  const drawMedia = () => {
    mediaFrame = 0;
    if (!mediaWorld || usesStaticMediaLayout()) return;
    renderedProgress += (targetProgress - renderedProgress) * .18;
    const cursor = .1 + renderedProgress * (mediaCompositions.length - .45);
    const stageWidth = mediaWorld.clientWidth;
    const stageHeight = mediaWorld.clientHeight;
    mediaNodes.forEach((node, index) => {
      const group = Math.floor(index / 4);
      const slot = index % 4;
      const layout = mediaCompositions[group]?.[slot];
      if (!layout) return;
      const phase = cursor - group - slot * .055;
      const entering = smooth(clamp((phase + .55) / .4));
      const approaching = smooth(clamp((phase + .42) / .65));
      const leaving = smooth(clamp((phase - .65) / .7));
      const entryX = .5 + (layout.x - .5) * .72;
      const entryY = .52 + (layout.y - .52) * .72;
      const exitX = layout.x + (layout.x - .5) * .42;
      const exitY = layout.y + (layout.y - .52) * .32;
      const x = mix(mix(entryX, layout.x, approaching), exitX, leaving) * stageWidth;
      const y = mix(mix(entryY, layout.y, approaching), exitY, leaving) * stageHeight;
      const scale = mix(mix(.4, 1, approaching), 1.36, leaving);
      const opacity = entering * mix(.72, 1, approaching) * (1 - leaving);
      node.style.setProperty('--sequence-width', `${Math.min(stageWidth * layout.w, layout.max)}px`);
      node.style.setProperty('--sequence-opacity', opacity.toFixed(4));
      node.style.setProperty('--sequence-scale', scale.toFixed(4));
      node.style.setProperty('--sequence-x', `${x.toFixed(1)}px`);
      node.style.setProperty('--sequence-y', `${y.toFixed(1)}px`);
      node.style.setProperty('--sequence-rotate', `${(slot % 2 === 0 ? -1 : 1) * (1 - approaching) * 1.4}deg`);
      node.style.setProperty('--sequence-blur', `${(1 - approaching) * .8}px`);
      node.style.zIndex = String(20 + Math.round(phase * 20) + layout.layer);
      node.classList.toggle('is-active', opacity > .5);
      node.classList.toggle('is-focus', approaching > .78 && leaving < .45);
      const control = mediaControl(node);
      if (control) control.tabIndex = opacity > .5 ? 0 : -1;
      node.setAttribute('aria-hidden', String(opacity <= .5));
    });
    if (Math.abs(targetProgress - renderedProgress) > .00008) mediaFrame = frame(drawMedia);
  };
  const updateMedia = () => {
    if (!media || !mediaWorld || !mediaNodes.length) return;
    if (usesStaticMediaLayout()) {
      if (mediaIntro) mediaIntro.style.opacity = '1';
      mediaNodes.forEach((node) => {
        node.classList.remove('is-active', 'is-focus');
        const control = mediaControl(node);
        if (control) control.tabIndex = 0;
        node.removeAttribute('aria-hidden');
      });
      return;
    }
    const rect = media.getBoundingClientRect();
    const offset = innerWidth <= 1050 ? 76 : 92;
    targetProgress = clamp((offset - rect.top) / Math.max(1, rect.height - innerHeight + offset));
    if (mediaIntro) mediaIntro.style.opacity = String(Math.max(0, 1 - targetProgress * 13));
    if (!mediaFrame) mediaFrame = frame(drawMedia);
  };
  observe(window, 'scroll', updateMedia, { passive: true });
  observe(window, 'resize', updateMedia);
  updateMedia();

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
    createdMediaControls.forEach((control) => control.remove());
  };
}
