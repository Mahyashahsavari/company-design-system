import puppeteer from 'file:///C:/Users/mahya.sh/AppData/Local/Temp/wr-shot-deps/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { mkdirSync } from 'node:fs';

const outDir = 'd:/company-design-system/.tmp-screenshots';
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--disable-gpu'],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2', timeout: 30000 });
await page.waitForSelector('[data-testid="mobile-room-view"]', { timeout: 15000 });
await new Promise((r) => setTimeout(r, 400));

const labels = await page.evaluate(() =>
  [...document.querySelectorAll('[role="tab"]')].map((el) => el.textContent?.trim()),
);
console.log('tabs', labels);

await page.screenshot({ path: `${outDir}/room-mobile-incident.png` });

const join = await page.$('[data-testid="dock-join"]');
if (join) {
  await join.click();
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: `${outDir}/room-mobile-joined.png` });
}

await browser.close();
console.log('ok');
