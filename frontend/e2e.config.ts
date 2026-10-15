import { web } from '@e2e-dev/web';
import type { E2EConfig } from 'e2e';

// No model is needed for deterministic tests. Never silently skip an agent
// step when a provider is missing; add an explicit provider before using one.
export default {
  projectId: 'cs-biz-console',
  tests: ['tests/e2e/**/*.e2e.ts'],
  workers: 1,
  retries: 0,
  timeout: 45_000,
  actionTimeout: 8_000,
  assertionTimeout: 10_000,
  trace: 'retain-on-failure',
  cache: 'off',
  output: '.e2e',
  reporters: ['list', 'junit', 'markdown'],
  targets: [{
    name: 'desktop-chromium',
    engine: web({
      viewport: { width: 1536, height: 1024 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
    }),
    app: {
      url: 'http://127.0.0.1:5778',
      command: {
        executable: 'corepack',
        args: ['pnpm', 'preview'],
        reuseExisting: false,
        startupTimeout: 45_000,
        env: { TURBO_TELEMETRY_DISABLED: '1', DO_NOT_TRACK: '1' },
      },
    },
  }],
} satisfies E2EConfig;
