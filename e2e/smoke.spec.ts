import { expect, test } from './fixtures';

test('signed-out visitors land on the Bulgarian sign-in page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'bg');
  await expect(page).toHaveTitle('Будител');
  await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
});
