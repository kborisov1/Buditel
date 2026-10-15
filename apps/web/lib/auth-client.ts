// Talks to the same HTTP API a mobile client would use; no server actions.
export type AuthResult = { ok: true } | { ok: false; error: AuthError };
export type AuthError = 'invalid_credentials' | 'email_taken' | 'weak_password' | 'unknown';

/** Maps a Better Auth error code to the message key the UI shows. */
export function authErrorFromCode(code: unknown): AuthError {
  const value = typeof code === 'string' ? code : '';
  if (value.startsWith('INVALID_EMAIL_OR_PASSWORD')) return 'invalid_credentials';
  if (value.startsWith('USER_ALREADY_EXISTS')) return 'email_taken';
  if (value.startsWith('PASSWORD_TOO_')) return 'weak_password';
  return 'unknown';
}

async function post(path: string, body?: unknown): Promise<AuthResult> {
  try {
    const res = await fetch(`/api/auth${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: authErrorFromCode(data?.code) };
  } catch {
    return { ok: false, error: 'unknown' };
  }
}

export const signUp = (input: { name: string; email: string; password: string }) =>
  post('/sign-up/email', input);

export const signIn = (input: { email: string; password: string }) => post('/sign-in/email', input);

export const signOut = () => post('/sign-out');
