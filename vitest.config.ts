import { defineConfig } from 'vitest/config';

try {
  process.loadEnvFile('.env');
} catch {
  // No .env file: database tests are skipped unless DATABASE_URL is set.
}

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts', 'apps/*/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.next/**'],
  },
});
