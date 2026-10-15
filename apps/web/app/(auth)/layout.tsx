import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getCurrentUser } from '../../lib/session';

export default async function AuthLayout({ children }: { children: ReactNode }) {
  if (await getCurrentUser()) redirect('/');
  return <AuthFrame>{children}</AuthFrame>;
}

function AuthFrame({ children }: { children: ReactNode }) {
  const t = useTranslations('App');
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-4 py-8">
      <p className="text-3xl font-bold">{t('name')}</p>
      {children}
    </main>
  );
}
