import puppeteer from 'file:///C:/Users/mahya.sh/AppData/Local/Temp/wr-shot-deps/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { mkdirSync } from 'node:fs';

const outDir = 'd:/company-design-system/.tmp-screenshots';
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--disable-gpu'],
});

async function shot(width, height, name) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('.monosuite-room-row', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 500));
  const metrics = await page.evaluate(() => {
    const row = document.querySelector('.monosuite-room-row');
    const utility = document.querySelector('.monosuite-room-utility-panel');
    const workflow = document.querySelector('.monosuite-workflow');
    const floatPanel = document.querySelector('.monosuite-live-float-panel');
    const chain = document.querySelector('.monosuite-threat-rail-scroll')?.parentElement?.parentElement;
    return {
      density: row?.getAttribute('data-density'),
      utilityWidth: utility ? Math.round(utility.getBoundingClientRect().width) : null,
      workflowHeight: workflow ? Math.round(workflow.getBoundingClientRect().height) : null,
      workflowStrip: workflow?.classList.contains('monosuite-workflow--strip') ?? false,
      floatHeight: floatPanel ? Math.round(floatPanel.getBoundingClientRect().height) : null,
      chainWidth: chain ? Math.round(chain.getBoundingClientRect().width) : null,
      inner: { w: window.innerWidth, h: window.innerHeight },
    };
  });
  await page.screenshot({ path: `${outDir}/${name}.png` });
  await page.close();
  return metrics;
}

const laptop = await shot(1366, 768, 'room-1366');
const fullhd = await shot(1920, 1080, 'room-1920');
console.log(JSON.stringify({ laptop, fullhd }, null, 2));
await browser.close();
