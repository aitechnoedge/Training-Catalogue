import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { deploymentEnvironment, isProductionDeployment } from '../server/deploymentEnvironment.mjs';

const distDirectory = path.resolve('dist');

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(entryPath) : [entryPath];
  }));
  return nested.flat();
}

const target = deploymentEnvironment();
if (isProductionDeployment()) {
  console.log('Production deployment safety check passed.');
} else {
  const files = await filesBelow(distDirectory);
  const htmlFiles = files.filter((file) => file.endsWith('.html'));
  assert.ok(htmlFiles.length > 0, 'No built HTML files were found.');
  const results = await Promise.all(htmlFiles.map(async (file) => ({
    file,
    html: await readFile(file, 'utf8'),
  })));
  for (const { file, html } of results) {
    assert.match(
      html,
      /<meta\s+name=["']robots["']\s+content=["']noindex, nofollow, noarchive["']\s*\/?\s*>/i,
      `${path.relative(distDirectory, file)} is not protected from indexing.`,
    );
  }
  const robots = await readFile(path.join(distDirectory, 'robots.txt'), 'utf8');
  assert.equal(robots, 'User-agent: *\nDisallow: /\n');
  console.log(`Deployment safety check passed for ${target} (${htmlFiles.length} HTML files).`);
}
