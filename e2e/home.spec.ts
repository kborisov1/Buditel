import { createDb } from '../packages/core/src/db/client';
import { lessons, units } from '../packages/core/src/db/schema';
import { expect, test } from './fixtures';

async function seedCourse() {
  const db = createDb(process.env.TEST_DATABASE_URL!);
  const [unit] = await db.insert(units).values({ title: 'Паисий', position: 1 }).returning();
  await db.insert(lessons).values([
    { unitId: unit!.id, position: 1, status: 'published', title: 'Първи урок' },
    { unitId: unit!.id, position: 2, status: 'published', title: 'Втори урок' },
    { unitId: unit!.id, position: 3, status: 'draft', title: 'Чернова' },
  ]);
  await db.$client.end();
}

async function signUp(page: import('@playwright/test').Page) {
  await page.goto('/sign-up');
  await page.getByLabel('Име', { exact: true }).fill('Иван');
  await page.getByLabel('Имейл').fill('home@example.test');
  await page.getByLabel('Парола').fill('correct-horse-battery');
  await page.getByRole('button', { name: 'Регистрирай се' }).click();
}

test('the home screen is a path of published lessons with only the next one open', async ({
  page,
}) => {
  await seedCourse();
  await signUp(page);

  await expect(page.getByRole('heading', { name: 'Паисий' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Първи урок/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Втори урок/ })).toHaveCount(0);
  await expect(page.getByText('Заключен')).toBeVisible();
  await expect(page.getByText('Чернова')).toHaveCount(0);
});

test('the home screen says so when there are no lessons yet', async ({ page }) => {
  await signUp(page);
  await expect(page.getByText('Все още няма публикувани уроци.')).toBeVisible();
});
