import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.resolve(scriptDirectory, '../apps/corporate-site/public');
const galleryDirectory = path.join(publicDirectory, 'assets/training-media');
const galleryFiles = [
  'training-auditorium-wide.jpeg',
  'training-classroom-intro.jpeg',
  'training-team-campus.jpeg',
  'training-ai-lab.jpeg',
  'training-auditorium-selfie.jpeg',
  'training-team-global.jpeg',
  'training-classroom-session.jpeg',
  'training-team-corporate.jpeg',
  'training-team-workshop.jpeg',
  'training-bloom-session.jpeg',
  'training-interactive-room.jpeg',
  'training-enterprise-team.jpeg',
  'recognition-mit-memento.jpg',
  'recognition-smsos-2025.jpg',
  'recognition-youtube-letter.jpg',
  'recognition-mit-letter.jpg',
];

for (const fileName of galleryFiles) {
  const sourcePath = path.join(galleryDirectory, fileName);
  const outputPath = path.join(galleryDirectory, `${path.parse(fileName).name}-1200.webp`);

  await sharp(sourcePath)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(outputPath);
}

console.log(`Optimized ${galleryFiles.length} corporate gallery images.`);
