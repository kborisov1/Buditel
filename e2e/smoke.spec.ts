import { expect, test } from './fixtures';

test('home page renders in Bulgarian', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'bg');
  await expect(page.getByRole('heading', { name: 'Будител' })).toBeVisible();
  await expect(page).toHaveTitle('Будител');
});

test('a new learner can sign up and read their profile through the API', async ({ request }) => {
  const signUp = await request.post('/api/auth/sign-up/email', {
    data: { email: 'e2e@example.test', password: 'correct-horse-battery', name: 'Иван' },
  });
  expect(signUp.ok()).toBe(true);

  const me = await request.get('/api/me');
  expect(me.ok()).toBe(true);
  expect((await me.json()).user).toMatchObject({ email: 'e2e@example.test', role: 'learner' });
});
