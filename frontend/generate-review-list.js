import fs from 'fs';
import path from 'path';

const reviewDir = path.resolve('public/review');
const outputFile = path.resolve('src/utils/reviewImages.js');

try {
  const files = fs.readdirSync(reviewDir)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.webp', '.jpg', '.jpeg', '.png'].includes(ext);
    });

  // Put latest 2026-09-30 webp reviews at the front so latest results are seen first
  files.sort((a, b) => {
    const aIsNew = a.startsWith('PHOTO-2026-09-30');
    const bIsNew = b.startsWith('PHOTO-2026-09-30');
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;
    return a.localeCompare(b);
  });

  const content = `// Auto-generated review images list
const reviewImages = ${JSON.stringify(files, null, 2)};

export default reviewImages;
`;

  fs.writeFileSync(outputFile, content);
  console.log(`Generated list of ${files.length} review images at ${outputFile}`);
} catch (err) {
  console.error('Error generating review images list:', err);
}
