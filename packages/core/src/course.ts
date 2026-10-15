import type { Lesson, ResultSummary } from '@buditel/schema';
import { and, asc, eq, sql } from 'drizzle-orm';
import type { Database } from './db';
import { lessons, progress, units } from './db/schema';

export type LessonState = 'completed' | 'unlocked' | 'locked';

/** Who is asking. Admins also see drafts and may open any lesson. */
export type Viewer = { userId: string; isAdmin: boolean };

/**
 * Linear unlocking: the first lesson is open, and each later lesson opens once the one
 * before it is completed. Completed lessons stay open.
 */
export function lessonStates(orderedIds: string[], completed: Set<string>): LessonState[] {
  return orderedIds.map((id, i) => {
    if (completed.has(id)) return 'completed';
    const previous = orderedIds[i - 1];
    return previous === undefined || completed.has(previous) ? 'unlocked' : 'locked';
  });
}

async function orderedLessons(db: Database, viewer: Viewer) {
  return db
    .select({
      id: lessons.id,
      unitId: lessons.unitId,
      unitTitle: units.title,
      title: lessons.title,
      position: lessons.position,
      status: lessons.status,
    })
    .from(lessons)
    .innerJoin(units, eq(units.id, lessons.unitId))
    .where(viewer.isAdmin ? undefined : eq(lessons.status, 'published'))
    .orderBy(asc(units.position), asc(lessons.position));
}

async function completedIds(db: Database, userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ lessonId: progress.lessonId })
    .from(progress)
    .where(eq(progress.userId, userId));
  return new Set(rows.map((r) => r.lessonId));
}

async function stateById(db: Database, viewer: Viewer) {
  const rows = await orderedLessons(db, viewer);
  const done = await completedIds(db, viewer.userId);
  const states = lessonStates(
    rows.map((r) => r.id),
    done,
  );
  return { rows, states, byId: new Map(rows.map((r, i) => [r.id, states[i]!])) };
}

export type CourseUnit = {
  id: string;
  title: string;
  lessons: {
    id: string;
    title: string;
    status: Lesson['status'];
    state: LessonState;
  }[];
};

/** The home-screen path: units in order, each with its lessons and their state. */
export async function getCourse(db: Database, viewer: Viewer): Promise<CourseUnit[]> {
  const { rows, states } = await stateById(db, viewer);
  const course: CourseUnit[] = [];
  rows.forEach((row, i) => {
    let unit = course.at(-1);
    if (unit?.id !== row.unitId) {
      unit = { id: row.unitId, title: row.unitTitle, lessons: [] };
      course.push(unit);
    }
    unit.lessons.push({ id: row.id, title: row.title, status: row.status, state: states[i]! });
  });
  return course;
}

export type LessonAccess =
  { ok: true; lesson: Lesson; state: LessonState } | { ok: false; reason: 'not_found' | 'locked' };

export async function getLessonForViewer(
  db: Database,
  viewer: Viewer,
  lessonId: string,
): Promise<LessonAccess> {
  const { byId } = await stateById(db, viewer);
  const state = byId.get(lessonId);
  if (!state) return { ok: false, reason: 'not_found' };
  if (state === 'locked' && !viewer.isAdmin) return { ok: false, reason: 'locked' };

  const [row] = await db
    .select({
      id: lessons.id,
      unitId: lessons.unitId,
      position: lessons.position,
      status: lessons.status,
      title: lessons.title,
      steps: lessons.steps,
    })
    .from(lessons)
    .where(eq(lessons.id, lessonId));
  if (!row) return { ok: false, reason: 'not_found' };
  return { ok: true, lesson: { ...row, schemaVersion: 1 }, state };
}

/** Records a completed lesson. Re-completing keeps the latest result. */
export async function completeLesson(
  db: Database,
  viewer: Viewer,
  lessonId: string,
  result: ResultSummary,
): Promise<{ ok: true } | { ok: false; reason: 'not_found' | 'locked' }> {
  const { byId } = await stateById(db, viewer);
  const state = byId.get(lessonId);
  if (!state) return { ok: false, reason: 'not_found' };
  if (state === 'locked' && !viewer.isAdmin) return { ok: false, reason: 'locked' };

  await db
    .insert(progress)
    .values({ userId: viewer.userId, lessonId, result })
    .onConflictDoUpdate({
      target: [progress.userId, progress.lessonId],
      set: { result, completedAt: sql`now()` },
    });
  return { ok: true };
}

/** Overall progress for the profile, e.g. 12 of 50 published lessons. */
export async function getProgressOverview(db: Database, userId: string) {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(${progress.lessonId})::int`,
    })
    .from(lessons)
    .leftJoin(progress, and(eq(progress.lessonId, lessons.id), eq(progress.userId, userId)))
    .where(eq(lessons.status, 'published'));
  return { completed: row?.completed ?? 0, total: row?.total ?? 0 };
}
