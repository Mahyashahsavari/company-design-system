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
await page.evaluate(() => {
  localStorage.setItem('mantine-color-scheme-value', 'dark');
});
await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
await page.waitForFunction(
  () => document.documentElement.getAttribute('data-mantine-color-scheme') === 'dark',
  { timeout: 10000 },
);

const tokens = await page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  return {
    scheme: document.documentElement.getAttribute('data-mantine-color-scheme'),
    tealLight: cs.getPropertyValue('--mantine-color-teal-light').trim(),
    tealLightColor: cs.getPropertyValue('--mantine-color-teal-light-color').trim(),
    tealFilled: cs.getPropertyValue('--mantine-color-teal-filled').trim(),
    teal6: cs.getPropertyValue('--mantine-color-teal-6').trim(),
    primaryLight: cs.getPropertyValue('--mantine-primary-color-light').trim(),
    surface: cs.getPropertyValue('--monosuite-color-surface').trim(),
  };
});
console.log('tokens', JSON.stringify(tokens, null, 2));

await page.waitForFunction(
  () => [...document.querySelectorAll('button')].some((b) => b.textContent?.includes('Invite participant')),
  { timeout: 15000 },
);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((el) =>
    el.textContent?.includes('Invite participant'),
  );
  b?.click();
});
await page.waitForSelector('[data-testid="invite-participants-modal"]', { timeout: 10000 });
await page.evaluate(() => {
  const tab = [...document.querySelectorAll('[role="tab"]')].find((el) =>
    el.textContent?.includes('External guest'),
  );
  tab?.click();
});
await page.waitForFunction(() => document.body.innerText.includes('Add another guest'), {
  timeout: 10000,
});
await new Promise((r) => setTimeout(r, 400));

const measured = await page.evaluate(() => {
  const add = [...document.querySelectorAll('button')].find((b) =>
    b.textContent?.includes('Add another guest'),
  );
  const alertEl = document.querySelector('.mantine-Alert-root');
  const addCs = add ? getComputedStyle(add) : null;
  const alertCs = alertEl ? getComputedStyle(alertEl) : null;
  return {
    addBg: addCs?.backgroundColor,
    addColor: addCs?.color,
    alertBg: alertCs?.backgroundColor,
  };
});
console.log('measured', JSON.stringify(measured, null, 2));

await page.screenshot({ path: `${outDir}/invite-dark-primary.png` });
await browser.close();
console.log('ok');
