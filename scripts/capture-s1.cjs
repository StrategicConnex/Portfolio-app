const { spawn } = require('child_process');
const { writeFileSync, existsSync, mkdirSync } = require('fs');
const path = require('path');

function checkServer(url) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 3000);
    fetch(url).then(r => { clearTimeout(timer); resolve(r.ok); }).catch(() => { clearTimeout(timer); resolve(false); });
  });
}

async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const ok = await checkServer(url);
    if (ok) return true;
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  const playwright = require('playwright');
  const { chromium } = playwright;

  console.log('Starting Next.js dev server...');
    const serverProc = spawn('node node_modules/next/dist/bin/next dev -p 3000', {
    shell: true,
    stdio: 'pipe',
    cwd: process.cwd(),
  });
  serverProc.stdout.on('data', d => console.log('[server]', d.toString().trim()));
  serverProc.stderr.on('data', d => console.error('[server]', d.toString().trim()));

  try {
    console.log('Waiting for server...');
    const ready = await waitForServer('http://localhost:3000');
    if (!ready) {
      console.error('Server not ready');
      process.exit(1);
    }
    console.log('Server is ready!');

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-web-security', '--use-gl=angle', '--use-angle=swiftshader'],
    });

    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
    });

    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

    await page.waitForSelector('canvas', { timeout: 15000 });
    console.log('Canvas found');

    // Scroll to home section (#home) to trigger S1 camera
    await page.evaluate(() => {
      const home = document.querySelector('#home');
      if (home) home.scrollIntoView({ behavior: 'auto', block: 'center' });
    });

    // Wait for 3D scene to render
    await new Promise(r => setTimeout(r, 5000));

    const outDir = 'artwork/living-datacenter/refcheck';
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

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

    console.log('Screenshots captured!');
    console.log('  - Viewport: ' + path.join(outDir, 'current-s1-boot.png'));
    console.log('  - Canvas:   ' + path.join(outDir, 'current-s1-canvas.png'));

    await browser.close();
  } finally {
    console.log('Stopping dev server...');
    serverProc.kill('SIGTERM', { force: true });
    console.log('Done.');
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
