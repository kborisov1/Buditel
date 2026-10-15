import { createAuth, createDb, tables } from '@buditel/core';
import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { resetDatabase } from '../../../test/db';
import { createApi } from './api';

const url = process.env.DATABASE_URL || undefined;
const origin = 'http://localhost:3000';

describe.skipIf(!url)('API', () => {
  const db = createDb(url ?? '');
  const auth = createAuth(db, { secret: process.env.BETTER_AUTH_SECRET!, baseURL: origin });
  const api = createApi({ db, auth });
  afterAll(() => db.$client.end());

  function request(path: string, init: RequestInit & { cookie?: string } = {}) {
    const headers = new Headers(init.headers);
    headers.set('origin', origin);
    if (init.cookie) headers.set('cookie', init.cookie);
    if (init.body) headers.set('content-type', 'application/json');
    return api.request(`${origin}/api${path}`, { ...init, headers });
  }

  /** Signs up a new account and returns its session cookie. */
  async function signUp(email = 'learner@example.test', extra: Record<string, unknown> = {}) {
    const res = await request('/auth/sign-up/email', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'correct-horse-battery', name: 'Иван', ...extra }),
    });
    expect(res.status).toBe(200);
    const cookie = res.headers
      .getSetCookie()
      .map((c) => c.split(';')[0])
      .join('; ');
    return { cookie, email };
  }

  beforeEach(async () => {
    await resetDatabase(db);
    await db.insert(tables.units).values({ id: 'u1', title: 'Ранно пробуждане', position: 1 });
    await db.insert(tables.lessons).values([
      {
        id: 'l1',
        unitId: 'u1',
        position: 1,
        title: 'Паисий',
        status: 'published',
        steps: [{ id: 's1', type: 'story', text: 'През 1762 г. …' }],
      },
      { id: 'l2', unitId: 'u1', position: 2, title: 'Софроний', status: 'published' },
      { id: 'd1', unitId: 'u1', position: 3, title: 'Чернова', status: 'draft' },
    ]);
  });

  it('reports health without a session', async () => {
    expect((await request('/health')).status).toBe(200);
  });

  it('rejects learner routes without a session', async () => {
    for (const path of ['/me', '/course', '/lessons/l1']) {
      expect((await request(path)).status).toBe(401);
    }
  });

  it('signs up a learner who cannot choose their own role', async () => {
    const { cookie } = await signUp('sneaky@example.test', { role: 'admin' });
    const res = await request('/me', { cookie });
    const body = await res.json();
    expect(body.user.role).toBe('learner');
    expect(body.progress).toEqual({ completed: 0, total: 2 });
  });

  it('signs in with email and password', async () => {
    const { email } = await signUp();
    const res = await request('/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'correct-horse-battery' }),
    });
    expect(res.status).toBe(200);
    const wrong = await request('/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'wrong-password' }),
    });
    expect(wrong.status).toBe(401);
  });

  it('walks a learner through opening, completing and unlocking lessons', async () => {
    const { cookie } = await signUp();

    const course = await (await request('/course', { cookie })).json();
    expect(course.units[0].lessons.map((l: { id: string; state: string }) => l.state)).toEqual([
      'unlocked',
      'locked',
    ]);

    const lesson = await request('/lessons/l1', { cookie });
    expect(lesson.status).toBe(200);
    expect((await lesson.json()).lesson.steps).toHaveLength(1);
    expect((await request('/lessons/l2', { cookie })).status).toBe(403);
    expect((await request('/lessons/d1', { cookie })).status).toBe(404);

    const result = { totalQuestions: 0, correctFirstTry: 0, missedStepIds: [] };
    const done = await request('/lessons/l1/complete', {
      method: 'POST',
      cookie,
      body: JSON.stringify(result),
    });
    expect(done.status).toBe(200);
    expect((await request('/lessons/l2', { cookie })).status).toBe(200);
  });

  it('rejects an invalid completion body', async () => {
    const { cookie } = await signUp();
    const res = await request('/lessons/l1/complete', {
      method: 'POST',
      cookie,
      body: JSON.stringify({ totalQuestions: -1 }),
    });
    expect(res.status).toBe(400);
  });

  it('lets admins preview drafts', async () => {
    const { cookie, email } = await signUp('admin@example.test');
    await db.update(tables.users).set({ role: 'admin' }).where(eq(tables.users.email, email));
    expect((await request('/lessons/d1', { cookie })).status).toBe(200);
  });
});
