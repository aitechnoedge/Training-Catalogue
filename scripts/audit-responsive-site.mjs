import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const projectRoot = process.cwd();
const outputRoot = path.join(
  projectRoot,
  'artifacts',
  process.env.AUDIT_OUTPUT || 'responsive-audit-2026-10-14',
);
const screenshotRoot = path.join(outputRoot, 'screenshots');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3000';

const pages = [
  { id: 'home', path: '/website/', template: 'Corporate home' },
  { id: 'elearning', path: '/e-learning/', template: 'E-learning home' },
  { id: 'catalogue', path: '/catalogue', template: 'Catalogue listing' },
  { id: 'catalogue-page-2', path: '/catalogue/page/2', template: 'Catalogue pagination' },
  { id: 'catalogue-page-44', path: '/catalogue/page/44', template: 'Catalogue pagination edge' },
  { id: 'programme-rb', path: '/programmes/RB0001', template: 'Role-based programme detail' },
  { id: 'programme-tt', path: '/programmes/TT0001', template: 'Tools programme detail' },
  { id: 'programme-certification', path: '/programmes/CER0116', template: 'Certification detail' },
  { id: 'insights', path: '/insights', template: 'Insights listing' },
  { id: 'insight-article', path: '/insights/ai-coding-assistants-in-enterprise-software-development-in-2026-how-to-train-developers-for-speed-without-increasing-security-and-code-quality-risk', template: 'Insight article' },
  { id: 'careers', path: '/careers', template: 'Careers listing' },
  { id: 'career-role', path: '/careers/designer', template: 'Career role detail' },
  { id: 'training-roi', path: '/training-roi', template: 'Training ROI tool' },
  { id: 'service-training', path: '/services/corporate-training', template: 'Service landing' },
  { id: 'service-elearning', path: '/services/custom-elearning-development', template: 'Service landing variant' },
  { id: 'solution-ai', path: '/solutions/ai-readiness-training', template: 'Solution landing' },
  { id: 'solution-onboarding', path: '/solutions/enterprise-onboarding', template: 'Solution landing variant' },
  { id: 'industry-bfsi', path: '/industries/bfsi', template: 'Industry landing' },
  { id: 'industry-manufacturing', path: '/industries/manufacturing', template: 'Industry landing variant' },
  { id: 'market-india', path: '/markets/india', template: 'Market landing' },
  { id: 'market-global', path: '/markets/global-delivery', template: 'Market landing variant' },
  { id: 'category-role', path: '/catalogue/role-based', template: 'Catalogue category landing' },
  { id: 'category-ai', path: '/catalogue/ai-tools', template: 'Catalogue category landing variant' },
  { id: 'about', path: '/about', template: 'Trust/content page' },
  { id: 'contact', path: '/contact', template: 'Contact page' },
  { id: 'author', path: '/authors/technoedge-editorial-team', template: 'Author page' },
  { id: 'editorial-policy', path: '/editorial-policy', template: 'Policy page' },
  { id: 'privacy', path: '/privacy', template: 'Policy page variant' },
  { id: 'terms', path: '/terms', template: 'Policy page variant' },
  { id: 'admin-login', path: '/adminzz', template: 'Private admin login' },
  { id: 'not-found', path: '/responsive-audit-not-found', template: '404 page' },
];

const viewports = [
  { id: 'mobile-390', width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  { id: 'tablet-768', width: 768, height: 1024, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  { id: 'desktop-1440', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  { id: 'wide-2560', width: 2560, height: 1440, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
];

const screenshotPages = new Set([
  'home', 'elearning', 'catalogue', 'programme-rb', 'insights', 'insight-article',
  'careers', 'career-role', 'training-roi', 'service-training', 'contact', 'admin-login', 'not-found',
]);

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--hide-scrollbars'],
});

await fs.mkdir(screenshotRoot, { recursive: true });

const auditResults = [];

async function inspectPage(pageInfo, viewport) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 500));
  });
  page.on('pageerror', (error) => pageErrors.push(error.message.slice(0, 500)));
  page.on('requestfailed', (request) => {
    const failure = request.failure();
    failedRequests.push({ url: request.url(), error: failure?.errorText || 'unknown' });
  });

  page.setDefaultTimeout(8_000);
  await page.setViewport(viewport);
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

  const url = `${baseUrl}${pageInfo.path}`;
  let responseStatus = null;
  let navigationError = null;
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25_000 });
    responseStatus = response?.status() ?? null;
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      const auditStyle = document.createElement('style');
      auditStyle.textContent = '*,*::before,*::after{animation-duration:0.001ms!important;animation-iteration-count:1!important;transition-duration:0.001ms!important;scroll-behavior:auto!important}';
      document.head.append(auditStyle);
    });
  } catch (error) {
    navigationError = error.message;
  }

  const metrics = navigationError ? null : await page.evaluate((physicalViewportWidth) => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
    };

    const selectorFor = (element) => {
      if (element.id) return `#${element.id}`;
      const classes = [...element.classList].slice(0, 3).join('.');
      return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ''}`;
    };

    const viewportWidth = window.innerWidth;
    const overflowElements = [...document.querySelectorAll('body *')]
      .filter((element) => {
        if (!visible(element)) return false;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const intentionallyScrollable = ['auto', 'scroll'].includes(style.overflowX);
        const movingTrack = /track|marquee|carousel|world|ribbon/i.test(element.className || '');
        return !intentionallyScrollable && !movingTrack && (rect.right > physicalViewportWidth + 2 || rect.left < -2);
      })
      .slice(0, 20)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          selector: selectorFor(element),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          text: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
        };
      });

    const brokenImages = [...document.images]
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => ({ src: image.currentSrc || image.src, alt: image.alt }))
      .slice(0, 20);

    const smallTargets = [...document.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [role="tab"]')]
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          selector: selectorFor(element),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          text: (element.textContent || element.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 80),
        };
      })
      .filter((target) => target.width < 44 || target.height < 44)
      .slice(0, 30);

    const fixedElements = [...document.querySelectorAll('body *')]
      .filter((element) => visible(element) && ['fixed', 'sticky'].includes(getComputedStyle(element).position))
      .slice(0, 30)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          selector: selectorFor(element),
          position: getComputedStyle(element).position,
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
        };
      });

    const controls = [...document.querySelectorAll('button, [role="tab"], select')]
      .filter(visible)
      .map((element) => ({
        selector: selectorFor(element),
        text: (element.textContent || element.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 100),
        expanded: element.getAttribute('aria-expanded'),
        selected: element.getAttribute('aria-selected'),
      }))
      .slice(0, 100);

    return {
      title: document.title,
      pathname: location.pathname,
      h1: [...document.querySelectorAll('h1')].filter(visible).map((heading) => heading.textContent.trim().replace(/\s+/g, ' ')),
      mainCount: document.querySelectorAll('main').length,
      viewportWidth,
      physicalViewportWidth,
      layoutExpansion: viewportWidth - physicalViewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, viewportWidth) - physicalViewportWidth,
      documentHeight: document.documentElement.scrollHeight,
      overflowElements,
      brokenImages,
      smallTargets,
      fixedElements,
      controls,
    };
  }, viewport.width);

  if (!navigationError && screenshotPages.has(pageInfo.id)) {
    const screenshotPath = path.join(screenshotRoot, `${pageInfo.id}--${viewport.id}.png`);
    await Promise.race([
      page.screenshot({ path: screenshotPath, fullPage: false }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Screenshot timed out')), 12_000)),
    ]).catch((error) => console.error(`${pageInfo.id}/${viewport.id}: ${error.message}`));
  }

  await page.close();

  return {
    page: pageInfo,
    viewport: { id: viewport.id, width: viewport.width, height: viewport.height },
    url,
    responseStatus,
    navigationError,
    consoleErrors: [...new Set(consoleErrors)],
    pageErrors: [...new Set(pageErrors)],
    failedRequests: failedRequests.filter((request, index, all) => all.findIndex((candidate) => candidate.url === request.url) === index).slice(0, 30),
    metrics,
  };
}

try {
  for (const pageInfo of pages) {
    const pageResults = [];
    for (const viewport of viewports) pageResults.push(await inspectPage(pageInfo, viewport));
    auditResults.push(...pageResults);
    process.stdout.write(`${pageInfo.id}: ${pageResults.map((result) => `${result.viewport.id}=${result.metrics?.horizontalOverflow ?? 'error'}px`).join(', ')}\n`);
  }
} finally {
  await browser.close();
}

await fs.writeFile(path.join(outputRoot, 'responsive-metrics.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl, pages, viewports, results: auditResults }, null, 2)}\n`);

const summary = auditResults.map((result) => ({
  page: result.page.id,
  template: result.page.template,
  viewport: result.viewport.id,
  status: result.responseStatus,
  overflow: result.metrics?.horizontalOverflow ?? null,
  overflowElements: result.metrics?.overflowElements.length ?? null,
  brokenImages: result.metrics?.brokenImages.length ?? null,
  smallTargets: result.metrics?.smallTargets.length ?? null,
  consoleErrors: result.consoleErrors.length,
  pageErrors: result.pageErrors.length,
  failedRequests: result.failedRequests.length,
  h1: result.metrics?.h1.join(' | ') || '',
}));

await fs.writeFile(path.join(outputRoot, 'responsive-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`Audit written to ${outputRoot}\n`);
