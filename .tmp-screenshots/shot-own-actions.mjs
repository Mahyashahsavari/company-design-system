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
await page.waitForSelector('[aria-label="Edit"]', { timeout: 15000 });
await page.evaluate(() => {
  const edit = document.querySelector('[aria-label="Edit"]');
  edit?.closest('.monosuite-investigation-item')?.scrollIntoView({ block: 'center' });
});
const card = await page.$('.monosuite-investigation-item');
if (card) await card.screenshot({ path: `${outDir}/own-answer-actions.png` });

await page.click('[aria-label="Edit"]');
await new Promise((r) => setTimeout(r, 300));
if (card) await card.screenshot({ path: `${outDir}/own-answer-editing.png` });
await page.click('button::-p-text(Cancel)');

const viewBtn = await page.evaluateHandle(() =>
  [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('View discussion')),
);
if (viewBtn.asElement()) {
  await viewBtn.asElement().click();
  await new Promise((r) => setTimeout(r, 300));
  if (card) await card.screenshot({ path: `${outDir}/own-comment-actions.png` });
}

await page.click('[role="tab"][data-tab="chat"], button::-p-text(Chat)');
const chatTab = await page.evaluateHandle(() =>
  [...document.querySelectorAll('button, [role="tab"]')].find((el) => el.textContent?.trim() === 'Chat'),
);
if (chatTab.asElement()) await chatTab.asElement().click();
await page.waitForFunction(() => document.body.innerText.includes('Room Chat'), { timeout: 8000 });
await new Promise((r) => setTimeout(r, 400));
const bubble = await page.$('[data-own="true"]');
if (bubble) await bubble.screenshot({ path: `${outDir}/own-chat-actions.png` });

await browser.close();
console.log('ok');
