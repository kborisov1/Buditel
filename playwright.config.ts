import { defineConfig, devices } from '@playwright/test';

try {
  process.loadEnvFile('.env');
} catch {
  // No .env file: rely on the environment (CI).
}

// Its own port so it never collides with `make dev` on 3000.
const port = 3100;
const baseURL = `http://localhost:${port}`;
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) throw new Error('TEST_DATABASE_URL is not set');

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './test/db-setup.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Tests share one database.
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build -w @buditel/web && npm run start -w @buditel/web -- -p ${port}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL: testDatabaseUrl,
      BETTER_AUTH_URL: baseURL,
      DISABLE_AUTH_RATE_LIMIT: 'true',
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET || 'e2e-secret-at-least-32-characters-long',
    },
  },
});
