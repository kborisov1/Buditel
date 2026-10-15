import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Database } from './db';
import { accounts, sessions, users, verifications } from './db/schema';

export type AuthOptions = { secret: string; baseURL: string };

export function createAuth(db: Database, options: AuthOptions) {
  return betterAuth({
    ...options,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: { user: users, session: sessions, account: accounts, verification: verifications },
    }),
    emailAndPassword: { enabled: true },
    user: {
      additionalFields: {
        // Never settable through sign-up or profile updates.
        role: { type: 'string', required: false, input: false, defaultValue: 'learner' },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
