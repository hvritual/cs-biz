import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const frontendRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  testDir: '../tests/e2e',
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || resolve(frontendRoot, 'test-results'),
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: process.env.PLAYWRIGHT_REPORT_DIR || resolve(frontendRoot, 'playwright-report'), open: 'never' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:5778',
    viewport: { width: 1536, height: 1024 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    reducedMotion: 'reduce',
    actionTimeout: 8_000,
    navigationTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: executablePath ? {
      executablePath,
      args: ['--disable-dev-shm-usage', '--disable-gpu', '--no-zygote'],
    } : undefined,
  },
  webServer: {
    command: 'corepack pnpm preview',
    cwd: frontendRoot,
    url: 'http://127.0.0.1:5778',
    reuseExistingServer: false,
    timeout: 45_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
