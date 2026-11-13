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
  const pos = 9068625;
  console.log('Results.jsx code:', js.slice(pos - 100, pos + 1200));
}

main().catch(console.error);

