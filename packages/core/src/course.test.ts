import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { resetDatabase } from '../../../test/db';
import {
  completeLesson,
  getCourse,
  getLessonForViewer,
  getProgressOverview,
  lessonStates,
} from './course';
import { createDb } from './db';
import { lessons, units, users } from './db/schema';

describe('lessonStates', () => {
  it('opens only the first lesson for a new learner', () => {
    expect(lessonStates(['a', 'b', 'c'], new Set())).toEqual(['unlocked', 'locked', 'locked']);
  });

  it('opens the lesson after the last completed one', () => {
    expect(lessonStates(['a', 'b', 'c'], new Set(['a']))).toEqual([
      'completed',
      'unlocked',
      'locked',
    ]);
  });

  it('keeps completed lessons open', () => {
    expect(lessonStates(['a', 'b'], new Set(['a', 'b']))).toEqual(['completed', 'completed']);
  });

  it('handles an empty course', () => {
    expect(lessonStates([], new Set())).toEqual([]);
  });
});

const url = process.env.DATABASE_URL || undefined;

describe.skipIf(!url)('course services', () => {
  const db = createDb(url ?? '');
  afterAll(() => db.$client.end());

  const result = { totalQuestions: 1, correctFirstTry: 1, missedStepIds: [] };
  let learner: { userId: string; isAdmin: boolean };
  const admin = () => ({ ...learner, isAdmin: true });

  beforeEach(async () => {
    await resetDatabase(db);
    const [user] = await db
      .insert(users)
      .values({ name: 'Иван', email: 'i@example.test' })
      .returning();
    learner = { userId: user!.id, isAdmin: false };
    const [u1, u2] = await db
      .insert(units)
      .values([
        { id: 'u1', title: 'Ранно пробуждане', position: 1 },
        { id: 'u2', title: 'Образование и църква', position: 2 },
      ])
      .returning();
    await db.insert(lessons).values([
      { id: 'l2', unitId: u1!.id, position: 2, title: 'Софроний', status: 'published' },
      { id: 'l1', unitId: u1!.id, position: 1, title: 'Паисий', status: 'published' },
      { id: 'draft', unitId: u1!.id, position: 3, title: 'Чернова', status: 'draft' },
      { id: 'l3', unitId: u2!.id, position: 1, title: 'Килийни училища', status: 'published' },
    ]);
  });

  it('builds the course path in unit and lesson order, hiding drafts from learners', async () => {
    const course = await getCourse(db, learner);
    expect(course.map((u) => [u.id, u.lessons.map((l) => [l.id, l.state])])).toEqual([
      [
        'u1',
        [
          ['l1', 'unlocked'],
          ['l2', 'locked'],
        ],
      ],
      ['u2', [['l3', 'locked']]],
    ]);
  });

  it('shows drafts to admins', async () => {
    const course = await getCourse(db, admin());
    expect(course[0]!.lessons.map((l) => l.id)).toEqual(['l1', 'l2', 'draft']);
  });

  it('unlocks the next lesson, across units, once the previous one is completed', async () => {
    await completeLesson(db, learner, 'l1', result);
    await completeLesson(db, learner, 'l2', result);
    const course = await getCourse(db, learner);
    expect(course[1]!.lessons[0]!.state).toBe('unlocked');
  });

  it('refuses locked lessons and drafts to learners', async () => {
    expect(await getLessonForViewer(db, learner, 'l2')).toEqual({ ok: false, reason: 'locked' });
    expect(await getLessonForViewer(db, learner, 'draft')).toEqual({
      ok: false,
      reason: 'not_found',
    });
    expect(await completeLesson(db, learner, 'l2', result)).toEqual({
      ok: false,
      reason: 'locked',
    });
  });

  it('lets admins preview drafts', async () => {
    const access = await getLessonForViewer(db, admin(), 'draft');
    expect(access.ok && access.lesson.status).toBe('draft');
  });

  it('keeps the latest result when a lesson is completed again', async () => {
    await completeLesson(db, learner, 'l1', result);
    expect(await completeLesson(db, learner, 'l1', { ...result, correctFirstTry: 0 })).toEqual({
      ok: true,
    });
    expect(await getProgressOverview(db, learner.userId)).toEqual({ completed: 1, total: 3 });
  });
});
