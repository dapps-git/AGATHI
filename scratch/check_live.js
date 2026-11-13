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
  const html = await get('https://www.agadichoornam.com');
  console.log('HTML length:', html.length);
  const regex = /\/assets\/[a-zA-Z0-9_\-\.]+\.(js|css)/g;
  const matches = html.match(regex);
  console.log('Matches:', matches);
  if (matches) {
    for (const asset of matches) {
      if (asset.endsWith('.js')) {
        const js = await get('https://www.agadichoornam.com' + asset);
        console.log('Asset:', asset, 'length:', js.length);
        console.log('Contains isDynHelper?', js.includes('isDynHelper'));
        console.log('Contains dynamicReviewImages?', js.includes('dynamicReviewImages'));
        console.log('Contains isDefault: false?', js.includes('isDefault'));
      }
    }
  }
}

main().catch(console.error);

