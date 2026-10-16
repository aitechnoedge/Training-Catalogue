import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const projectRoot = process.cwd();
const outputRoot = path.join(
  projectRoot,
  'artifacts',
  'responsive-audit-2026-10-14',
  process.env.AUDIT_SECTION_OUTPUT || 'home-sections',
);
const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3000';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const viewports = [
  { id: 'mobile-390', width: 390, height: 844, isMobile: true, hasTouch: true },
  { id: 'tablet-768', width: 768, height: 1024, isMobile: true, hasTouch: true },
  { id: 'desktop-1440', width: 1440, height: 900, isMobile: false, hasTouch: false },
  { id: 'wide-2560', width: 2560, height: 1440, isMobile: false, hasTouch: false },
];

await fs.mkdir(outputRoot, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--hide-scrollbars'],
});

const results = [];

const settle = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

for (const viewport of viewports) {
  const page = await browser.newPage();
  await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('technoedge-analytics-consent', 'denied');
  });
  await page.goto(`${baseUrl}/website/`, { waitUntil: 'domcontentloaded', timeout: 25_000 });
  await settle(1800);
  await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });

  const metrics = await page.evaluate((physicalWidth) => {
    const rect = (element) => {
      const value = element?.getBoundingClientRect();
      return value ? {
        top: Math.round(value.top + scrollY),
        left: Math.round(value.left),
        width: Math.round(value.width),
        height: Math.round(value.height),
        right: Math.round(value.right),
        bottom: Math.round(value.bottom + scrollY),
      } : null;
    };
    const impact = document.querySelector('.impact');
    const impactGrid = document.querySelector('.impact-grid');
    const media = document.querySelector('.media-universe');
    const mediaWorld = document.querySelector('.media-world');
    const nodes = [...document.querySelectorAll('.media-node')];
    const controls = [...document.querySelectorAll('.media-open-control')];
    const images = [...document.querySelectorAll('.media-node img')];
    return {
      physicalWidth,
      innerWidth,
      layoutExpansion: innerWidth - physicalWidth,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      impact: {
        rect: rect(impact),
        heading: document.querySelector('#impact-title')?.textContent?.trim(),
        overflowX: impactGrid ? getComputedStyle(impactGrid).overflowX : null,
        gridClientWidth: impactGrid?.clientWidth ?? null,
        gridScrollWidth: impactGrid?.scrollWidth ?? null,
        cards: [...document.querySelectorAll('.impact-card')].map((card) => ({
          label: card.querySelector('p')?.textContent?.trim(),
          value: card.querySelector('.impact-value')?.textContent?.trim(),
          rect: rect(card),
        })),
      },
      media: {
        rect: rect(media),
        worldRect: rect(mediaWorld),
        heading: document.querySelector('#media-universe-title')?.textContent?.trim(),
        nodes: nodes.length,
        controls: controls.length,
        controlsPerNode: nodes.map((node) => node.querySelectorAll(':scope > .media-open-control').length),
        duplicateControlNodes: nodes.filter((node) => node.querySelectorAll(':scope > .media-open-control').length > 1).length,
        nodeKinds: {
          photos: document.querySelectorAll('.media-node.media-photo').length,
          quotes: document.querySelectorAll('.media-node.media-quote').length,
          recognition: document.querySelectorAll('.media-node.media-recognition').length,
        },
        images: images.length,
        loadedImages: images.filter((image) => image.complete && image.naturalWidth > 0).length,
        sourcePixels: images.reduce((sum, image) => sum + image.naturalWidth * image.naturalHeight, 0),
        firstNode: rect(nodes[0]),
        lastNode: rect(nodes.at(-1)),
      },
    };
  }, viewport.width);

  const impactY = metrics.impact.rect.top;
  await page.evaluate((y) => scrollTo(0, Math.max(0, y - 90)), impactY);
  await settle();
  await page.screenshot({ path: path.join(outputRoot, `impact--${viewport.id}.png`) });

  const mediaTop = metrics.media.rect.top;
  const mediaTravel = Math.max(0, metrics.media.rect.height - viewport.height);
  const stops = viewport.width <= 760
    ? [
        { id: 'start', y: mediaTop - 76 },
        { id: 'middle', y: mediaTop + metrics.media.rect.height * .46 },
        { id: 'end', y: mediaTop + metrics.media.rect.height - viewport.height },
      ]
    : [
        { id: 'start', y: mediaTop - 92 },
        { id: 'middle', y: mediaTop + mediaTravel * .5 },
        { id: 'end', y: mediaTop + mediaTravel * .96 },
      ];

  for (const stop of stops) {
    await page.evaluate((y) => scrollTo(0, Math.max(0, y)), stop.y);
    await settle(900);
    await page.screenshot({ path: path.join(outputRoot, `real-moments-${stop.id}--${viewport.id}.png`) });
  }

  results.push({ viewport, metrics });
  process.stdout.write(`${viewport.id}: layout +${metrics.layoutExpansion}px; impact ${metrics.impact.gridClientWidth}/${metrics.impact.gridScrollWidth}px; moments ${metrics.media.nodes} nodes, ${metrics.media.controls} controls, ${metrics.media.rect.height}px tall\n`);
  await page.close();
}

await browser.close();
await fs.writeFile(path.join(outputRoot, 'section-metrics.json'), `${JSON.stringify(results, null, 2)}\n`);
process.stdout.write(`Section audit written to ${outputRoot}\n`);
