'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signOut } from '../lib/auth-client';

export function SignOutButton() {
  const t = useTranslations('Shell');
  const router = useRouter();

  async function onClick() {
    await signOut();
    router.replace('/sign-in');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-200"
    >
      {t('signOut')}
    </button>
  );
}
