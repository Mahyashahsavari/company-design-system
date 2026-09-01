import puppeteer from 'file:///C:/Users/mahya.sh/AppData/Local/Temp/wr-shot-deps/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { mkdirSync } from 'node:fs';

const outDir = 'd:/company-design-system/.tmp-screenshots';
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--window-size=1440,1100', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1100 });
await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2', timeout: 30000 });
await page.click('[aria-label="Edit room settings"]');
await page.waitForSelector('[data-testid="room-settings-modal"] input[placeholder="Enter your room title"]', {
  timeout: 10000,
});
await new Promise((r) => setTimeout(r, 400));

await page.$eval(
  '[data-testid="room-settings-modal"] input[placeholder="Enter your room title"]',
  (el) => {
    const input = el;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    setter.call(input, 'Containment review');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  },
);
await new Promise((r) => setTimeout(r, 400));
const value = await page.$eval(
  '[data-testid="room-settings-modal"] input[placeholder="Enter your room title"]',
  (el) => el.value,
);
console.log('title', value);

const overlay = await page.waitForSelector(
  '[data-testid="room-settings-modal"] .mantine-Modal-overlay',
);
await overlay.click({ offset: { x: 12, y: 12 } });
await new Promise((r) => setTimeout(r, 500));
const after = await page.evaluate(() => ({
  discard: document.body.innerText.includes('Discard changes?'),
  settings: document.body.innerText.includes('Room Settings'),
  keep: document.body.innerText.includes('Keep editing'),
}));
console.log(after);
await page.screenshot({ path: `${outDir}/discard-room-settings.png` });
await browser.close();
