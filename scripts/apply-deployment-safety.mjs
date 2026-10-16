import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { deploymentEnvironment, isProductionDeployment } from '../server/deploymentEnvironment.mjs';

const distDirectory = path.resolve('dist');
const noIndexTag = '<meta name="robots" content="noindex, nofollow, noarchive" />';

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(entryPath) : [entryPath];
  }));
  return nested.flat();
}

function protectHtml(html) {
  const robotsPattern = /<meta\s+name=["']robots["'][^>]*>/i;
  if (robotsPattern.test(html)) return html.replace(robotsPattern, noIndexTag);
  if (!/<\/head>/i.test(html)) throw new Error('HTML document does not contain a closing head tag.');
  return html.replace(/<\/head>/i, `  ${noIndexTag}\n</head>`);
}

const target = deploymentEnvironment();
if (isProductionDeployment()) {
  console.log('Production deployment detected; search indexing remains enabled.');
} else {
  const files = await filesBelow(distDirectory);
  const htmlFiles = files.filter((file) => file.endsWith('.html'));
  await Promise.all(htmlFiles.map(async (file) => {
    const html = await readFile(file, 'utf8');
    await writeFile(file, protectHtml(html), 'utf8');
  }));
  await writeFile(
    path.join(distDirectory, 'robots.txt'),
    'User-agent: *\nDisallow: /\n',
    'utf8',
  );
  console.log(`Protected ${htmlFiles.length} HTML files from indexing for ${target}.`);
}
