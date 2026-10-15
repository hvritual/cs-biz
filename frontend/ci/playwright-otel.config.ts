// O1-P1 one-purpose queryable-span smoke; not the Human-only Full Gate.
// Reuses P0's real Vite + Go localhost web servers.
import { defineConfig } from '@playwright/test';
import p0 from './playwright-trace.config';

export default defineConfig(p0, {
  testDir: '../tests/otel-smoke',
  outputDir: 'test-results-otel',
  timeout: 90_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-otel', open: 'never' }],
  ],
});
