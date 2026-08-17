import { defineConfig, devices } from '@playwright/test';

// PORT lets CI (or a local check) run against a `next start` server on a
// port other than the default dev port. Some environments export PORT=0,
// which is meaningless for a fixed URL, so treat it as unset.
const port = process.env.PORT && process.env.PORT !== '0' ? process.env.PORT : '3000';
const baseURL = `http://localhost:${port}`;

// E2E_PROD_SERVER=1 points the webServer at the production build
// (`npm run start`, requires a prior `npm run build`) instead of the dev
// server — this is how the CI workflow runs the suite.
const isProdServer = process.env.E2E_PROD_SERVER === '1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    navigationTimeout: 60_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: isProdServer ? 'npm run start' : 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
