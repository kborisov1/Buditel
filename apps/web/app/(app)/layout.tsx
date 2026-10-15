import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { SignOutButton } from '../../components/SignOutButton';
import { getCurrentUser } from '../../lib/session';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const current = await getCurrentUser();
  if (!current) redirect('/sign-in');
  const t = await getTranslations('App');

  return (
    <div className="min-h-dvh">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-xl font-bold">{t('name')}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-600">{current.user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
    </div>
  );
}
