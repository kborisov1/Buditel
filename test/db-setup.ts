// Vitest global setup: makes sure the test database exists and is migrated.
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) return;

  const target = new URL(url);
  const name = target.pathname.slice(1);
  const admin = new URL(url);
  admin.pathname = '/postgres';

  const server = postgres(admin.toString(), { max: 1, onnotice: () => {} });
  const [exists] = await server`select 1 from pg_database where datname = ${name}`;
  if (!exists) await server.unsafe(`create database "${name.replace(/"/g, '""')}"`);
  await server.end();

  const client = postgres(url, { max: 1, onnotice: () => {} });
  await migrate(drizzle(client), { migrationsFolder: 'packages/core/drizzle' });
  await client.end();
}
