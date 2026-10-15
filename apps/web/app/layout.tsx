import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import './globals.css';

export async function generateMetadata() {
  const t = await getTranslations('App');
  return { title: t('name'), description: t('tagline') };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={await getLocale()}>
      <body className="min-h-dvh bg-stone-50 text-stone-900 antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
