import { test as base } from '@playwright/test';
import { createDb } from '../packages/core/src/db/client';
import { resetDatabase } from '../test/db';

/** Every test starts from an empty test database. */
export const test = base.extend<{ cleanDatabase: void }>({
  cleanDatabase: [
    // eslint-disable-next-line no-empty-pattern -- Playwright fixtures must destructure.
    async ({}, use) => {
      const db = createDb(process.env.TEST_DATABASE_URL!);
      await resetDatabase(db);
      await db.$client.end();
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
