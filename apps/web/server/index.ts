import { createAuth, db } from '@buditel/core';
import { createApi } from './api';

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

let api: ReturnType<typeof createApi> | undefined;

/** The process-wide API, built on first request from the environment. */
export function getApi() {
  if (!api) {
    const database = db();
    const auth = createAuth(database, {
      secret: env('BETTER_AUTH_SECRET'),
      baseURL: env('BETTER_AUTH_URL'),
      rateLimit: { enabled: process.env.DISABLE_AUTH_RATE_LIMIT !== 'true' },
    });
    api = createApi({ db: database, auth });
  }
  return api;
}
