import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['apps/console/src/**/*.test.ts'],
    environment: 'happy-dom',
    restoreMocks: true,
  },
});
