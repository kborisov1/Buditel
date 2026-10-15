import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('App');
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-2 px-4">
      <h1 className="text-4xl font-bold">{t('name')}</h1>
      <p className="text-stone-600">{t('tagline')}</p>
    </main>
  );
}
