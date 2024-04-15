import './globals.css';

import { GeistSans } from 'geist/font/sans';

import type { Metadata } from 'next';

import { Background } from '@/components/Background';
import { Header } from '@/components/Header';

import styles from './layout.module.css';

export const metadata: Metadata = {
  title: 'Bradley Schoeneweis',
  description: 'Bradley Schoeneweis',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <Background/>
        <main className={styles.main}>
          <Header/>
          <section className={styles.section}>
            {children}
          </section>
        </main>
      </body>
    </html>
  );
}
