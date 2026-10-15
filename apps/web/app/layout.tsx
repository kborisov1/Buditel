import type { ReactNode } from 'react';

export const metadata = { title: 'Будител' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bg">
      <body>{children}</body>
    </html>
  );
}
