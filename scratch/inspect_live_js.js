const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  const js = await get('https://www.agadichoornam.com/assets/index-DZBUUntR.js');
  
  // Find where Customer Result is rendered
  const idx = js.indexOf('Customer Result');
  if (idx !== -1) {
    console.log('Customer Result snippet:', js.slice(Math.max(0, idx - 200), idx + 200));
  } else {
    console.log('Customer Result not found');
  }

  // Find where dynamicReviewImages is handled
  let pos = 0;
  while ((pos = js.indexOf('dynamicReviewImages', pos)) !== -1) {
    console.log('dynamicReviewImages snippet @', pos, ':', js.slice(Math.max(0, pos - 150), pos + 250));
    pos += 20;
  }
}

main().catch(console.error);

