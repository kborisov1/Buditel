import { describe, expect, it } from 'vitest';
import { authErrorFromCode } from './auth-client';

describe('authErrorFromCode', () => {
  it('maps known Better Auth codes', () => {
    expect(authErrorFromCode('INVALID_EMAIL_OR_PASSWORD')).toBe('invalid_credentials');
    expect(authErrorFromCode('USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL')).toBe('email_taken');
    expect(authErrorFromCode('PASSWORD_TOO_SHORT')).toBe('weak_password');
  });

  it('falls back to unknown', () => {
    expect(authErrorFromCode('SOMETHING_ELSE')).toBe('unknown');
    expect(authErrorFromCode(undefined)).toBe('unknown');
  });
});
