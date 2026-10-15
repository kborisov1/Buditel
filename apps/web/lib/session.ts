import type { CourseUnit } from '@buditel/core';
import type { Lesson } from '@buditel/schema';
import { cookies } from 'next/headers';
import { getApi } from '../server';

export type CurrentUser = {
  user: { id: string; name: string; email: string; role: 'learner' | 'admin' };
  progress: { completed: number; total: number };
};

/** The signed-in user, read through the API like any other client. Null when signed out. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookie = (await cookies()).toString();
  if (!cookie) return null;
  const res = await getApi().fetch(new Request('http://localhost/api/me', { headers: { cookie } }));
  return res.ok ? await res.json() : null;
}

/** The home-screen path for the signed-in user: units in order, each with its lessons. */
export async function getCourse(): Promise<CourseUnit[]> {
  const cookie = (await cookies()).toString();
  const res = await getApi().fetch(
    new Request('http://localhost/api/course', { headers: { cookie } }),
  );
  return res.ok ? (await res.json()).units : [];
}

export type LessonResult =
  { ok: true; lesson: Lesson } | { ok: false; reason: 'not_found' | 'locked' | 'unauthorized' };

/** One lesson for the signed-in user, through the API. Locked lessons are refused there. */
export async function getLesson(id: string): Promise<LessonResult> {
  const cookie = (await cookies()).toString();
  const res = await getApi().fetch(
    new Request(`http://localhost/api/lessons/${encodeURIComponent(id)}`, { headers: { cookie } }),
  );
  if (res.ok) return { ok: true, lesson: (await res.json()).lesson };
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  return { ok: false, reason: res.status === 403 ? 'locked' : 'not_found' };
}
