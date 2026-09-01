import puppeteer from 'file:///C:/Users/mahya.sh/AppData/Local/Temp/wr-shot-deps/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { mkdirSync } from 'node:fs';

const outDir = 'd:/company-design-system/.tmp-screenshots';
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--window-size=390,844', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2', timeout: 30000 });
await page.waitForSelector('[data-testid="back-to-rooms"]', { timeout: 15000 });
await page.click('[data-testid="back-to-rooms"]');
await page.waitForSelector('[data-testid="rooms-page"]', { timeout: 10000 });
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${outDir}/mobile-rooms-list.png`, fullPage: false });
const list = await page.evaluate(() => ({
  title: document.querySelector('h2')?.textContent,
  cards: document.querySelectorAll('[data-testid^="open-room-"]').length,
}));
console.log('list', JSON.stringify(list));

await page.click('[data-testid="open-room-room-20481"]');
await page.waitForSelector('[data-testid="mobile-room-view"]', { timeout: 10000 });
console.log('back in room');

await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false });
await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2', timeout: 30000 });
await page.waitForSelector('[data-testid="back-to-rooms"]', { timeout: 15000 });
await page.click('[data-testid="back-to-rooms"]');
await page.waitForSelector('[data-testid="rooms-page"]', { timeout: 10000 });
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${outDir}/desktop-rooms-list.png`, fullPage: false });
console.log('desktop list ok');
await browser.close();
