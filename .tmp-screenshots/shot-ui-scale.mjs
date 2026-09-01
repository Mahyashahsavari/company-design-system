import puppeteer from 'file:///C:/Users/mahya.sh/AppData/Local/Temp/wr-shot-deps/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--disable-gpu'],
});

async function measure(width, height) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2', timeout: 30000 });
  const result = await page.evaluate(() => {
    const root = document.getElementById('root');
    const cs = root ? getComputedStyle(root) : null;
    return {
      innerWidth: window.innerWidth,
      scaleVar: root?.style.getPropertyValue('--war-room-ui-scale').trim(),
      computedZoom: cs?.zoom,
    };
  });
  await page.close();
  return result;
}

const laptop = await measure(1440, 900);
const qhd = await measure(2560, 1440);
const fullhd = await measure(1920, 1080);
const justBelow = await measure(1919, 1080);

console.log(JSON.stringify({ laptop, justBelow, fullhd, qhd }, null, 2));
await browser.close();
