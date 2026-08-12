import { spawn } from 'child_process';
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function waitForServer(url: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  console.log('Starting Next.js dev server...');
  const server = spawn('echo "Using existing server on port 3000"', { shell: true, stdio: 'pipe', cwd: process.cwd() });

  // Capture server output
  server.stdout?.on('data', (data) => process.stdout.write(`[server] ${data}`));
  server.stderr?.on('data', (data) => process.stderr.write(`[server] ${data}`));

  try {
    console.log('Waiting for server to be ready...');
    const ready = await waitForServer('http://localhost:3000');
    if (!ready) {
      console.error('Server did not start in time');
      process.exit(1);
    }
    console.log('Server is ready!');

    // Launch browser
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-web-security', '--use-gl=swiftshader'],
    });

    try {
      const page = await browser.newPage({
        viewport: { width: 1920, height: 1080 },
      });

      console.log('Navigating to http://localhost:3000...');
      await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for the canvas to appear (3D scene)
      await page.waitForSelector('canvas', { timeout: 15000 });
      console.log('Canvas found');

      // Scroll to home section (#home) to trigger S1 camera
      await page.evaluate(() => {
        const home = document.querySelector('#home');
        if (home) {
          home.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      });

      // Give the 3D scene time to render at S1 camera position
      await new Promise(r => setTimeout(r, 5000));

      // Capture the viewport
      await page.screenshot({
        path: join('artwork/living-datacenter/refcheck/current-s1-boot.png'),
        fullPage: false,
      });

      // Also save canvas-only crop
      const canvas = await page.$('canvas');
      if (canvas) {
        await canvas.screenshot({
          path: join('artwork/living-datacenter/refcheck/current-s1-canvas.png'),
        });
        const box = await canvas.boundingBox();
        if (box) {
          writeFileSync(
            join('artwork/living-datacenter/refcheck/current-s1-metadata.json'),
            JSON.stringify({ canvasBounds: box, captureTime: new Date().toISOString() }, null, 2)
          );
          console.log('Canvas bounds:', JSON.stringify(box));
        }
      }

      console.log('✅ Screenshots captured successfully');
      console.log('  - Viewport: artwork/living-datacenter/refcheck/current-s1-boot.png');
      console.log('  - Canvas:   artwork/living-datacenter/refcheck/current-s1-canvas.png');

    } finally {
      await browser.close();
    }
  } finally {
    // Server was started externally; nothing to clean up
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
