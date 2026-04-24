const puppeteer = require('C:/Users/yassi/AppData/Local/npm-cache/_npx/1ade4bf2e2bf80fd/node_modules/puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const htmlPath = 'file:///G:/Antigravity%20projects/BlockSenseAI/BlockSenseAI%20Brochure.html';
  await page.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.pdf({
    path: 'G:/Antigravity projects/BlockSenseAI/BlockSenseAI Brochure.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' }
  });
  await browser.close();
  console.log('PDF saved: BlockSenseAI Brochure.pdf');
})();
