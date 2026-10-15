import { expect, test } from './fixtures';

const password = 'correct-horse-battery';

async function signUp(page: import('@playwright/test').Page, email: string) {
  await page.goto('/sign-up');
  await page.getByLabel('Име', { exact: true }).fill('Иван');
  await page.getByLabel('Имейл').fill(email);
  await page.getByLabel('Парола').fill(password);
  await page.getByRole('button', { name: 'Регистрирай се' }).click();
}

test('a learner signs up, sees the shell, signs out and signs back in', async ({ page }) => {
  await signUp(page, 'ivan@example.test');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Здравей, Иван!' })).toBeVisible();

  await page.getByRole('button', { name: 'Изход' }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.getByLabel('Имейл').fill('ivan@example.test');
  await page.getByLabel('Парола').fill(password);
  await page.getByRole('button', { name: 'Влез' }).click();
  await expect(page.getByRole('heading', { name: 'Здравей, Иван!' })).toBeVisible();
});

test('sign-in rejects a wrong password', async ({ page }) => {
  await signUp(page, 'maria@example.test');
  await page.getByRole('button', { name: 'Изход' }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.getByLabel('Имейл').fill('maria@example.test');
  await page.getByLabel('Парола').fill('wrong-password');
  await page.getByRole('button', { name: 'Влез' }).click();
  await expect(page.locator('form [role=alert]')).toHaveText('Грешен имейл или парола.');
});

test('sign-up rejects an email that is already taken', async ({ page }) => {
  await signUp(page, 'dup@example.test');
  await page.getByRole('button', { name: 'Изход' }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  await signUp(page, 'dup@example.test');
  await expect(page.locator('form [role=alert]')).toHaveText('Вече има профил с този имейл.');
});

test('signed-in learners are sent away from the auth pages', async ({ page }) => {
  await signUp(page, 'back@example.test');
  await expect(page).toHaveURL('/');
  await page.goto('/sign-in');
  await expect(page).toHaveURL('/');
});
