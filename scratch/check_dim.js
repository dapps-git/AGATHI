const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'scratch', 'non_default');
const files = fs.readdirSync(dir);

function getWebPDimensions(buffer) {
  // WebP header
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    return null;
  }
  const chunkHeader = buffer.toString('ascii', 12, 16);
  if (chunkHeader === 'VP8X') {
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return { format: 'VP8X', width, height };
  } else if (chunkHeader === 'VP8 ') {
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { format: 'VP8', width, height };
  } else if (chunkHeader === 'VP8L') {
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { format: 'VP8L', width, height };
  }
  return null;
}

files.forEach(f => {
  const buf = fs.readFileSync(path.join(dir, f));
  const dim = getWebPDimensions(buf);
  console.log(f, dim ? `${dim.width}x${dim.height} (ratio: ${(dim.width/dim.height).toFixed(2)})` : 'unknown');
});

