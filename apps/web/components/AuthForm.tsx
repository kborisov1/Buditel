'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { type AuthError, signIn, signUp } from '../lib/auth-client';

const MIN_PASSWORD_LENGTH = 8;

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const isSignUp = mode === 'sign-up';
  const [error, setError] = useState<AuthError | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email')).trim();
    const password = String(form.get('password'));
    setPending(true);
    setError(null);
    const result = isSignUp
      ? await signUp({ name: String(form.get('name')).trim(), email, password })
      : await signIn({ email, password });
    if (result.ok) {
      router.replace('/');
      router.refresh();
      return;
    }
    setError(result.error);
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t(isSignUp ? 'signUpTitle' : 'signInTitle')}</h1>
      {isSignUp && <Field label={t('name')} name="name" type="text" autoComplete="name" required />}
      <Field label={t('email')} name="email" type="email" autoComplete="email" required />
      <Field
        label={t('password')}
        name="password"
        type="password"
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        minLength={isSignUp ? MIN_PASSWORD_LENGTH : undefined}
        hint={isSignUp ? t('passwordHint', { min: MIN_PASSWORD_LENGTH }) : undefined}
        required
      />
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {t(`errors.${error}`)}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-stone-900 px-4 py-2 font-medium text-white hover:bg-stone-700 disabled:opacity-60"
      >
        {t(isSignUp ? 'signUpSubmit' : 'signInSubmit')}
      </button>
      <p className="text-sm text-stone-600">
        {t(isSignUp ? 'haveAccount' : 'noAccount')}{' '}
        <Link
          href={isSignUp ? '/sign-in' : '/sign-up'}
          className="font-medium text-stone-900 underline"
        >
          {t(isSignUp ? 'signInLink' : 'signUpLink')}
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & React.ComponentProps<'input'>) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      <input
        {...input}
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-base font-normal"
      />
      {hint && <span className="text-xs font-normal text-stone-500">{hint}</span>}
    </label>
  );
}
