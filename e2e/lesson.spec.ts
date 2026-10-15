import { createDb } from '../packages/core/src/db/client';
import { lessons, units } from '../packages/core/src/db/schema';
import { expect, test } from './fixtures';

async function seedLesson() {
  const db = createDb(process.env.TEST_DATABASE_URL!);
  const [unit] = await db.insert(units).values({ title: 'Паисий', position: 1 }).returning();
  await db.insert(lessons).values([
    {
      unitId: unit!.id,
      position: 1,
      status: 'published',
      title: 'Първи урок',
      steps: [
        { id: 's1', type: 'story', text: 'Паисий написва историята през 1762 г.' },
        {
          id: 's2',
          type: 'multiple_choice',
          prompt: 'Кой е написал „История славянобългарска“?',
          options: [
            { id: 'a', text: 'Паисий Хилендарски' },
            { id: 'b', text: 'Васил Левски' },
          ],
          correctOptionId: 'a',
        },
        { id: 's3', type: 'true_false', prompt: 'Историята е написана през 1762 г.', answer: true },
        {
          id: 's4',
          type: 'fill_in',
          text: 'Паисий е монах в [[m]] манастир.',
          blanks: [{ id: 'm', answers: ['Хилендарския'] }],
        },
      ],
    },
    { unitId: unit!.id, position: 2, status: 'published', title: 'Втори урок' },
  ]);
  await db.$client.end();
}

test('a learner completes a lesson, repeats a missed question and unlocks the next lesson', async ({
  page,
}) => {
  await seedLesson();
  await page.goto('/sign-up');
  await page.getByLabel('Име', { exact: true }).fill('Иван');
  await page.getByLabel('Имейл').fill('lesson@example.test');
  await page.getByLabel('Парола').fill('correct-horse-battery');
  await page.getByRole('button', { name: 'Регистрирай се' }).click();

  await page.getByRole('link', { name: /Първи урок/ }).click();
  await expect(page.getByText('Паисий написва историята')).toBeVisible();
  await page.getByRole('button', { name: 'Продължи' }).click();

  // A wrong answer is flagged, and the question comes back at the end.
  await page.getByLabel('Васил Левски').check();
  await page.getByRole('button', { name: 'Провери' }).click();
  await expect(page.getByRole('status')).toContainText('Не точно');
  await page.getByRole('button', { name: 'Продължи' }).click();

  await page.getByLabel('Вярно', { exact: true }).check();
  await page.getByRole('button', { name: 'Провери' }).click();
  await expect(page.getByRole('status')).toContainText('Вярно!');
  await page.getByRole('button', { name: 'Продължи' }).click();

  await page.getByLabel('Празно място 1').fill('хилендарския');
  await page.getByRole('button', { name: 'Провери' }).click();
  await page.getByRole('button', { name: 'Продължи' }).click();

  await expect(page.getByLabel('Паисий Хилендарски')).toBeVisible();
  await page.getByLabel('Паисий Хилендарски').check();
  await page.getByRole('button', { name: 'Провери' }).click();
  await page.getByRole('button', { name: 'Продължи' }).click();

  await expect(page.getByText('Урокът е завършен!')).toBeVisible();
  await expect(page.getByText('2 от 3 верни отговора от първия опит.')).toBeVisible();
  await page.getByRole('button', { name: 'Продължи' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: /Втори урок/ })).toBeVisible();
});
