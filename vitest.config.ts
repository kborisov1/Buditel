import { defineConfig } from 'vitest/config';

try {
  process.loadEnvFile('.env');
} catch {
  // No .env file: rely on the environment (CI).
}

// Tests only ever see the test database; database tests are skipped without it.
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? '';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts', 'apps/*/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.next/**'],
    globalSetup: ['test/db-setup.ts'],
    // Database tests share one database and reset it, so files run one at a time.
    fileParallelism: false,
    env: {
      DATABASE_URL: testDatabaseUrl,
      BETTER_AUTH_SECRET: 'test-secret-at-least-32-characters-long',
      BETTER_AUTH_URL: 'http://localhost:3000',
    },
  },
});
