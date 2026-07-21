import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { PHProvider } from './providers';

const inter = Inter({ subsets: ['latin'] });

const BASE_URL = 'https://jangchoonggim-jyl1256-gmailcoms-projects.vercel.app';

export const metadata: Metadata = {
  title: '장충금 헌터 — 내 장기수선충당금 53만원 돌려받기',
  description: '이사 전 꼭 확인하세요. 아파트·오피스텔 세입자 평균 53만원 환급 가능. 3초 계산 → 집주인 즉시 청구. 공동주택관리법 제30조 근거.',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: '집주인이 안 알려준 내 돈 53만원 — 지금 바로 찾으세요',
    description: '아파트 2년 거주하면 평균 53만원. 3초 계산하고 집주인에게 즉시 청구 메시지를 보내보세요.',
    url: BASE_URL,
    siteName: 'Boro Refund',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '집주인이 안 알려준 내 돈 53만원 — 장충금 헌터',
    description: '이사 전 꼭 확인. 3초 계산 → 집주인 즉시 청구.',
  },
};

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className={inter.className}>
        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HBN1VLXHRD"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HBN1VLXHRD');
          `}
        </Script>

        {/* Microsoft Clarity */}
        <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wt1lm4ph25");
          `}
        </Script>
        
        <PHProvider>
          {children}
        </PHProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
