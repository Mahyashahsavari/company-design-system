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
await page.waitForSelector('.mantine-Modal-content input.mantine-TextInput-input', { timeout: 10000 });
await new Promise((r) => setTimeout(r, 500));

const info = await page.evaluate(() => {
  const input = document.querySelector('.mantine-Modal-content input.mantine-TextInput-input');
  const textarea = document.querySelector('.mantine-Modal-content textarea.mantine-Textarea-input');
  const cs = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    return { unicodeBidi: s.unicodeBidi, textAlign: s.textAlign, font: s.fontFamily };
  };
  return { input: cs(input), textarea: cs(textarea) };
});
console.log(JSON.stringify(info, null, 2));

await page.evaluate(() => {
  const input = document.querySelector('.mantine-Modal-content input.mantine-TextInput-input');
  const textarea = document.querySelector('.mantine-Modal-content textarea.mantine-Textarea-input');
  input.value = 'بررسی INC-20481 و lateral movement';
  textarea.value = 'حمله از 185.23.45.10 شروع شد. Need containment روی workstation-114.';
});

const content = await page.$('.mantine-Modal-content');
await content.screenshot({ path: `${outDir}/bidi-room-settings.png` });
await browser.close();
console.log('ok');
