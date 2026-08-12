import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-web-security'] });
  
  try {
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
    });

    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for the canvas to appear and render
    await page.waitForSelector('canvas', { timeout: 15000 });
    console.log('Canvas found');

    // Scroll to home section to trigger S1 camera
    await page.evaluate(() => {
      const home = document.querySelector('#home');
      if (home) {
        home.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    });

    // Give the 3D scene time to render at the S1 camera position
    await new Promise(r => setTimeout(r, 5000));

    // Capture the viewport
    const screenshot = await page.screenshot({
      path: join('artwork/living-datacenter/refcheck/current-s1-boot.png'),
      fullPage: false,
    });

    // Also save just the canvas area
    const canvas = await page.$('canvas');
    if (canvas) {
      await canvas.screenshot({
        path: join('artwork/living-datacenter/refcheck/current-s1-canvas.png'),
      });
    }

    console.log('Screenshots captured successfully');
    console.log(`  - Full viewport: artwork/living-datacenter/refcheck/current-s1-boot.png`);
    console.log(`  - Canvas area:   artwork/living-datacenter/refcheck/current-s1-canvas.png`);

    // Get canvas bounding box for metadata
    const box = await canvas?.boundingBox();
    if (box) {
      writeFileSync(
        join('artwork/living-datacenter/refcheck/current-s1-metadata.json'),
        JSON.stringify({ canvasBounds: box, captureTime: new Date().toISOString() }, null, 2)
      );
      console.log('Canvas bounds:', JSON.stringify(box));
    }

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
