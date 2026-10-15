// One narrow browser-to-Go trace smoke. Not the Human-only Full Browser gate.
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const frontendRoot = fileURLToPath(new URL('..', import.meta.url));
const backendRoot = fileURLToPath(new URL('../../backend/', import.meta.url));
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: '../tests/trace-smoke',
  outputDir: resolve(frontendRoot, 'test-results-trace'),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: resolve(frontendRoot, 'playwright-report-trace'), open: 'never' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:5777',
    viewport: { width: 1536, height: 1024 },
    locale: 'zh-CN',
    reducedMotion: 'reduce',
    launchOptions: executablePath ? {
      executablePath,
      args: ['--disable-dev-shm-usage', '--disable-gpu', '--no-zygote'],
    } : undefined,
  },
  webServer: [
    {
      command: 'corepack pnpm dev',
      cwd: frontendRoot,
      url: 'http://127.0.0.1:5777/auth/login',
      timeout: 90_000,
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'go run ./cmd/traceprobe',
      cwd: backendRoot,
      url: 'http://127.0.0.1:8097/__dev/ready',
      timeout: 90_000,
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
