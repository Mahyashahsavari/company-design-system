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
await new Promise((r) => setTimeout(r, 600));

const workflow = await page.evaluate(() => {
  const track = document.querySelector('.monosuite-workflow-focus-track');
  const cards = [...document.querySelectorAll('.monosuite-workflow-focus-card')].map((el) => ({
    role: el.getAttribute('data-role'),
    text: el.textContent?.replace(/\s+/g, ' ').trim(),
  }));
  const overflow = track ? track.scrollWidth > track.clientWidth + 1 : null;
  return { overflow, cards, hasOldTrack: Boolean(document.querySelector('.monosuite-workflow-track')) };
});
console.log('workflow', JSON.stringify(workflow, null, 2));
await page.screenshot({ path: `${outDir}/mobile-peek-workflow.png`, fullPage: false });

await page.click('[data-testid="dock-join"]');
await page.waitForSelector('[data-testid="dock-fullscreen"]', { timeout: 10000 });
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${outDir}/mobile-peek-joined.png`, fullPage: false });

await page.click('[data-testid="dock-fullscreen"]');
await page.waitForSelector('[data-testid="collaboration-layer"]', { timeout: 10000 });
await new Promise((r) => setTimeout(r, 500));
const fullscreen = await page.evaluate(() => {
  const layer = document.querySelector('[data-testid="collaboration-layer"]');
  const rail = document.querySelector('.monosuite-collab-participant-rail');
  const stage = document.querySelector('.monosuite-collab-stage');
  const header = document.querySelector('.monosuite-war-room-shell header');
  const exitDock = document.querySelector('[data-testid="dock-fullscreen"]');
  return {
    fullscreen: layer?.getAttribute('data-fullscreen'),
    railOrientation: rail?.getAttribute('data-orientation'),
    stageHeight: stage ? Math.round(stage.getBoundingClientRect().height) : null,
    headerHidden: header ? getComputedStyle(header).display === 'none' || header.getBoundingClientRect().height < 8 : true,
    hasExitDock: Boolean(exitDock),
  };
});
console.log('fullscreen', JSON.stringify(fullscreen, null, 2));
await page.screenshot({ path: `${outDir}/mobile-peek-fullscreen.png`, fullPage: false });
await browser.close();
