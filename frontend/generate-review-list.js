import fs from 'fs';
import path from 'path';

const reviewDir = path.resolve('public/review');
const outputFile = path.resolve('src/utils/reviewImages.js');

try {
  const files = fs.readdirSync(reviewDir)
    .filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png'));

  const content = `// Auto-generated review images list
const reviewImages = ${JSON.stringify(files, null, 2)};

export default reviewImages;
`;

  fs.writeFileSync(outputFile, content);
  console.log(`Generated list of ${files.length} review images at ${outputFile}`);
} catch (err) {
  console.error('Error generating review images list:', err);
}
