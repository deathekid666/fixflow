const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'public', 'sw-dashboard.js');
const PLACEHOLDER = '__SW_BUILD__';

if (process.argv.includes('--restore')) {
  // Restore placeholder after build so git stays clean
  let src = fs.readFileSync(swPath, 'utf8');
  src = src.replace(/fixflow-dashboard-[0-9a-z]+/g, `fixflow-dashboard-${PLACEHOLDER}`);
  fs.writeFileSync(swPath, src);
  console.log('[sw-version] Restored placeholder');
} else {
  // Inject a compact base-36 timestamp, e.g. "lq3kz4a"
  const version = Date.now().toString(36);
  let src = fs.readFileSync(swPath, 'utf8');
  src = src.replace(new RegExp(PLACEHOLDER, 'g'), version);
  fs.writeFileSync(swPath, src);
  console.log(`[sw-version] Injected build: ${version}`);
}
