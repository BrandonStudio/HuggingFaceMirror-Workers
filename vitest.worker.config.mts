import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.toml' },
    }),
  ],
  test: {
    inspector: {
      port: 9329,
      waitForDebugger: true,
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.unit.test.ts',
    ],
    setupFiles: ['test/setup.ts'],
  },
});
