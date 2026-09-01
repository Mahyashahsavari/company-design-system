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
await page.setViewport({
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
await page.goto('http://localhost:5174/rooms', { waitUntil: 'networkidle2', timeout: 30000 });
await page.waitForSelector('[data-testid="rooms-page"]', { timeout: 15000 });
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${outDir}/rooms-severity-cards.png`, fullPage: false });

await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2', timeout: 30000 });
await page.waitForSelector('.monosuite-threat-rail-card--incident', { timeout: 15000 });
const incident = await page.$('.monosuite-threat-rail-card--incident');
if (incident) await incident.screenshot({ path: `${outDir}/incident-severity-card.png` });
await browser.close();
