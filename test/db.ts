import { sql } from 'drizzle-orm';
import type { Database } from '../packages/core/src/db';

/** Empties every app table. Only ever runs against the test database. */
export async function resetDatabase(db: Database) {
  await db.execute(
    sql`truncate table audit_log, progress, media, lessons, units, verification, account, session, "user" cascade`,
  );
}
