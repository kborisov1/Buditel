// The HTTP API. Framework-free apart from Hono, so it can move to its own service unchanged.
import {
  type Auth,
  type Database,
  type Viewer,
  completeLesson,
  getCourse,
  getLessonForViewer,
  getProgressOverview,
} from '@buditel/core';
import { resultSummary } from '@buditel/schema';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';

type SessionUser = Auth['$Infer']['Session']['user'];
type Env = { Variables: { user: SessionUser; viewer: Viewer } };

export function createApi({ db, auth }: { db: Database; auth: Auth }) {
  const requireUser = createMiddleware<Env>(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'unauthorized' }, 401);
    c.set('user', session.user);
    c.set('viewer', { userId: session.user.id, isAdmin: session.user.role === 'admin' });
    await next();
  });

  const app = new Hono<Env>().basePath('/api');

  app.on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw));

  app.get('/health', (c) => c.json({ ok: true }));

  app.get('/me', requireUser, async (c) => {
    const { id, name, email, role } = c.get('user');
    return c.json({
      user: { id, name, email, role },
      progress: await getProgressOverview(db, id),
    });
  });

  app.get('/course', requireUser, async (c) =>
    c.json({ units: await getCourse(db, c.get('viewer')) }),
  );

  app.get('/lessons/:id', requireUser, async (c) => {
    const access = await getLessonForViewer(db, c.get('viewer'), c.req.param('id'));
    if (!access.ok) return c.json({ error: access.reason }, access.reason === 'locked' ? 403 : 404);
    return c.json({ lesson: access.lesson, state: access.state });
  });

  app.post('/lessons/:id/complete', requireUser, async (c) => {
    const body = resultSummary.safeParse(await c.req.json().catch(() => undefined));
    if (!body.success) return c.json({ error: 'invalid_body' }, 400);
    const done = await completeLesson(db, c.get('viewer'), c.req.param('id'), body.data);
    if (!done.ok) return c.json({ error: done.reason }, done.reason === 'locked' ? 403 : 404);
    return c.json({ ok: true });
  });

  return app;
}
