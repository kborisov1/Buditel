import { lesson as lessonSchema } from '@buditel/schema';
import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { resetDatabase } from '../../../../test/db';
import { createDb, type Database } from './client';
import { lessons, media, progress, units, users } from './schema';

const url = process.env.DATABASE_URL || undefined;

type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];

class Rollback extends Error {}

describe.skipIf(!url)('database schema', () => {
  const db = createDb(url ?? '');
  afterAll(() => db.$client.end());
  beforeEach(() => resetDatabase(db));

  /** Runs the body in a transaction that is always rolled back. */
  async function inRollback(body: (tx: Tx) => Promise<void>) {
    await expect(
      db.transaction(async (tx) => {
        await body(tx);
        throw new Rollback();
      }),
    ).rejects.toBeInstanceOf(Rollback);
  }

  async function seed(tx: Tx) {
    const [unit] = await tx
      .insert(units)
      .values({ title: 'Ранно пробуждане', position: 1 })
      .returning();
    const [user] = await tx
      .insert(users)
      .values({ name: 'Иван', email: `ivan-${crypto.randomUUID()}@example.test` })
      .returning();
    return { unit: unit!, user: user! };
  }

  it('stores lesson steps as JSONB that parses back through the lesson schema', async () => {
    await inRollback(async (tx) => {
      const { unit } = await seed(tx);
      const steps = [
        { id: 's1', type: 'story' as const, text: 'През 1762 г. …' },
        { id: 's2', type: 'true_false' as const, prompt: 'Вярно ли е?', answer: true },
      ];
      const [row] = await tx
        .insert(lessons)
        .values({ unitId: unit.id, position: 1, title: 'Паисий', steps })
        .returning();

      expect(row!.status).toBe('draft');
      expect(row!.schemaVersion).toBe(1);
      expect(lessonSchema.parse(row).steps).toEqual(steps);
    });
  });

  it('defaults new users to the learner role', async () => {
    await inRollback(async (tx) => {
      const { user } = await seed(tx);
      expect(user.role).toBe('learner');
    });
  });

  it('rejects two lessons at the same position in a unit', async () => {
    await inRollback(async (tx) => {
      const { unit } = await seed(tx);
      await tx.insert(lessons).values({ unitId: unit.id, position: 1, title: 'А' });
      await expect(
        tx.transaction((nested) =>
          nested.insert(lessons).values({ unitId: unit.id, position: 1, title: 'Б' }),
        ),
      ).rejects.toThrow();
    });
  });

  it('requires alt text on media', async () => {
    await inRollback(async (tx) => {
      await expect(
        tx.transaction((nested) =>
          nested.insert(media).values({
            storageKey: 'img/1.jpg',
            mime: 'image/jpeg',
            width: 10,
            height: 10,
            altText: null as unknown as string,
          }),
        ),
      ).rejects.toThrow();
    });
  });

  it('deletes a user’s progress with the user', async () => {
    await inRollback(async (tx) => {
      const { unit, user } = await seed(tx);
      const [row] = await tx
        .insert(lessons)
        .values({ unitId: unit.id, position: 1, title: 'А' })
        .returning();
      await tx.insert(progress).values({
        userId: user.id,
        lessonId: row!.id,
        result: { totalQuestions: 1, correctFirstTry: 1, missedStepIds: [] },
      });

      await tx.delete(users).where(eq(users.id, user.id));
      expect(await tx.select().from(progress).where(eq(progress.userId, user.id))).toEqual([]);
    });
  });
});
