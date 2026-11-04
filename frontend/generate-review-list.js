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

  // Sort latest webp reviews at the front (newest dates first, e.g. 2026-11-01, then 2026-09-30)
  files.sort((a, b) => {
    const aIsWebp = a.endsWith('.webp');
    const bIsWebp = b.endsWith('.webp');
    if (aIsWebp && !bIsWebp) return -1;
    if (!aIsWebp && bIsWebp) return 1;

    if (aIsWebp && bIsWebp) {
      const aDate = a.substring(0, 16);
      const bDate = b.substring(0, 16);
      if (aDate !== bDate) {
        return bDate.localeCompare(aDate);
      }
      return a.localeCompare(b);
    }

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
