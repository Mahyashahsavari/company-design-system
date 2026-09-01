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
await page.waitForSelector('[data-testid="edit-incident-button"]', { timeout: 15000 });
await page.click('[data-testid="edit-incident-button"]');
await page.waitForSelector('[data-testid="edit-incident-drawer"]', { timeout: 10000 });
await page.waitForFunction(() => document.body.innerText.includes('Add incident or alert IDs'), {
  timeout: 10000,
});

await page.evaluate(() => {
  const heading = [...document.querySelectorAll('*')].find((n) => n.textContent?.trim() === 'Linked Incident/Alert');
  heading?.scrollIntoView({ block: 'center' });
});

await page.screenshot({ path: `${outDir}/linked-ids-drawer.png` });

const clip = await page.evaluate(() => {
  const heading = [...document.querySelectorAll('*')].find((n) => n.textContent?.trim() === 'Linked Incident/Alert');
  const root = heading?.closest('.mantine-Stack-root') ?? heading?.parentElement?.parentElement;
  if (!root) return null;
  const r = root.getBoundingClientRect();
  return {
    x: Math.max(0, r.x - 8),
    y: Math.max(0, r.y - 8),
    width: Math.min(r.width + 16, 1440),
    height: Math.min(r.height + 16, 900),
  };
});

if (clip && clip.width > 0 && clip.height > 0) {
  await page.screenshot({ path: `${outDir}/linked-ids-field.png`, clip });
}

const field = await page.$('input[aria-label="Add incident or alert ID"]');
if (field) {
  await field.click({ clickCount: 1 });
  await field.type('INC-20499');
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 400));
  const afterClip = await page.evaluate(() => {
    const heading = [...document.querySelectorAll('*')].find((n) => n.textContent?.trim() === 'Linked Incident/Alert');
    const root = heading?.closest('.mantine-Stack-root') ?? heading?.parentElement?.parentElement;
    if (!root) return null;
    const r = root.getBoundingClientRect();
    return {
      x: Math.max(0, r.x - 8),
      y: Math.max(0, r.y - 8),
      width: Math.min(r.width + 16, 1440),
      height: Math.min(r.height + 16, 900),
    };
  });
  if (afterClip && afterClip.width > 0 && afterClip.height > 0) {
    await page.screenshot({ path: `${outDir}/linked-ids-after-add.png`, clip: afterClip });
  }
  console.log('added-id');
} else {
  console.log('field-not-found');
}

await browser.close();
console.log('ok');
