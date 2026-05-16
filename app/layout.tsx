import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '장충금 헌터 - 내 숨은 돈 찾기',
  description: '이사할 때 못 받은 장기수선충당금, 10초 만에 분석하고 돌려받으세요.',
};

import { PHProvider } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <PHProvider>
          {children}
        </PHProvider>
      </body>
    </html>
  );
}
