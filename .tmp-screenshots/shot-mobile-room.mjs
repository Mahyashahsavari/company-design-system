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

const metrics = await page.evaluate(() => {
  const root = document.getElementById('root');
  const view = document.querySelector('[data-testid="mobile-room-view"]');
  const investigate = document.body.innerText.includes('What is the initial attack vector');
  return {
    hasMobileView: Boolean(view),
    scale: root?.style.getPropertyValue('--war-room-ui-scale').trim(),
    zoom: root ? getComputedStyle(root).zoom : null,
    investigate,
    inner: { w: window.innerWidth, h: window.innerHeight },
  };
});

await page.screenshot({ path: `${outDir}/room-mobile-investigate.png` });

        await page.evaluate(() => {
  const control = [...document.querySelectorAll('label, button, [role="radio"]')].find((el) =>
    el.textContent?.trim() === 'Threat',
  );
  control?.click();
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${outDir}/room-mobile-threat.png` });

await page.evaluate(() => {
  const control = [...document.querySelectorAll('label, button, [role="radio"]')].find((el) =>
    el.textContent?.trim() === 'Room',
  );
  control?.click();
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${outDir}/room-mobile-room.png` });

await page.click('button[aria-label="Open navigation"]');
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: `${outDir}/room-mobile-nav.png` });

console.log(JSON.stringify(metrics, null, 2));
await browser.close();
