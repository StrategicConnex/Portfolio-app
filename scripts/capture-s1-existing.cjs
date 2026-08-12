const { writeFileSync, existsSync, mkdirSync } = require('fs');
const path = require('path');

async function main() {
  const playwright = require('playwright');
  const { chromium } = playwright;

  const outDir = 'artwork/living-datacenter/refcheck';
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-web-security', '--use-gl=angle', '--use-angle=swiftshader'],
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  console.log('Waiting for canvas...');
  await page.waitForSelector('canvas', { timeout: 15000 });
  console.log('Canvas found');

  // Listen for any browser errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[browser error]', msg.text());
    }
  });

  // Scroll to home section (#home) to trigger S1 camera
  await page.evaluate(() => {
    const home = document.querySelector('#home');
    if (home) home.scrollIntoView({ behavior: 'auto', block: 'center' });
  });

  // Give the 3D scene time to render at S1 camera position
  await new Promise(r => setTimeout(r, 5000));

  // Capture the viewport
  await page.screenshot({
    path: path.join(outDir, 'current-s1-boot.png'),
    fullPage: false,
  });

  // Also capture canvas area
  const canvas = await page.$('canvas');
  if (canvas) {
    await canvas.screenshot({
      path: path.join(outDir, 'current-s1-canvas.png'),
    });
    const box = await canvas.boundingBox();
    if (box) {
      writeFileSync(
        path.join(outDir, 'current-s1-metadata.json'),
        JSON.stringify({ canvasBounds: box, captureTime: new Date().toISOString() }, null, 2)
      );
      console.log('Canvas bounds:', JSON.stringify(box));
    }
  }

  console.log('✅ Screenshots captured!');
  console.log('  - Viewport: ' + path.join(outDir, 'current-s1-boot.png'));
  console.log('  - Canvas:   ' + path.join(outDir, 'current-s1-canvas.png'));

  await browser.close();
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
