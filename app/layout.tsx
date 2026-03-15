import './globals.css';

import { Analytics } from "@vercel/analytics/react"
import { GeistSans } from 'geist/font/sans';

import type { Metadata, Viewport } from 'next';

import { Header } from '@/components/Header';

import styles from './layout.module.css';

export const metadata: Metadata = {
  title: 'Bradley Schoeneweis',
  description: 'Bradley Schoeneweis',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <main className={`${styles.main} mainLayout`}>
          <Header/>
          <section className={`${styles.section} mainSection`}>
            {children}
            <Analytics />
          </section>
        </main>
      </body>
    </html>
  );
}
