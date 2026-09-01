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
await page.waitForSelector('[data-testid="mobile-room-view"]', { timeout: 15000 });
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: `${outDir}/mobile-focus-prejoin.png`, fullPage: false });

const metrics = await page.evaluate(() => {
  const workflow = document.querySelector('.monosuite-workflow');
  const track = document.querySelector('.monosuite-workflow-track');
  const tabs = document.querySelector('.monosuite-room-mobile-tabs');
  const tabLabels = [...document.querySelectorAll('.monosuite-room-mobile-tab')].map((el) =>
    el.textContent?.trim(),
  );
  const join = document.querySelector('[data-testid="dock-join"]');
  const dock = document.querySelector('[data-testid="media-control-dock"]');
  const joinBox = join?.getBoundingClientRect();
  const dockBox = dock?.getBoundingClientRect();
  return {
    workflowOverflow: workflow ? workflow.scrollWidth > workflow.clientWidth + 1 : null,
    hasTrack: Boolean(track),
    tabLabels,
    tabsJustify: tabs ? getComputedStyle(tabs).justifyContent : null,
    joinCenterOffset:
      joinBox && dockBox
        ? Math.abs(joinBox.left + joinBox.width / 2 - (dockBox.left + dockBox.width / 2))
        : null,
  };
});
console.log(JSON.stringify(metrics, null, 2));

await page.click('[data-testid="dock-join"]');
await page.waitForSelector('[data-testid="dock-live-controls"]', { timeout: 10000 });
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${outDir}/mobile-focus-joined.png`, fullPage: false });

const joined = await page.evaluate(() => {
  const controls = document.querySelector('[data-testid="dock-live-controls"]');
  const dock = document.querySelector('[data-testid="media-control-dock"]');
  const fs = document.querySelector('[data-testid="dock-fullscreen"]');
  const ids = [...(controls?.querySelectorAll('[data-testid]') ?? [])].map((el) =>
    el.getAttribute('data-testid'),
  );
  const cBox = controls?.getBoundingClientRect();
  const dBox = dock?.getBoundingClientRect();
  return {
    controlIds: ids,
    hasFullscreen: Boolean(fs),
    controlsJustify: controls ? getComputedStyle(controls).justifyContent : null,
    controlsCenterOffset:
      cBox && dBox ? Math.abs(cBox.left + cBox.width / 2 - (dBox.left + dBox.width / 2)) : null,
  };
});
console.log(JSON.stringify(joined, null, 2));

await page.click('[data-testid="dock-fullscreen"]');
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: `${outDir}/mobile-focus-fullscreen.png`, fullPage: false });
const fullscreen = await page.evaluate(() => ({
  collab: Boolean(document.querySelector('[data-testid="collaboration-layer"]')),
  fullscreenAttr: document.querySelector('[data-testid="collaboration-layer"]')?.getAttribute(
    'data-fullscreen',
  ),
}));
console.log(JSON.stringify(fullscreen, null, 2));
await browser.close();
