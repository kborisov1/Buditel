import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = ReturnType<typeof createDb>;

export function createDb(url: string) {
  return drizzle(postgres(url), { schema });
}

let shared: Database | undefined;

/** Process-wide connection, created on first use from DATABASE_URL. */
export function db(): Database {
  if (!shared) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    shared = createDb(url);
  }
  return shared;
}
