import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { PHProvider } from './providers';

const inter = Inter({ subsets: ['latin'] });

const BASE_URL = 'https://longtermrefund.site';

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
          {/* 포트원 & KCP 준수 전역 풋터 (사용자 경험 최우선 디자인) */}
          <footer className="w-full bg-slate-900 text-slate-400 border-t border-slate-800 py-10 px-4 text-xs font-sans">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-800 pb-4 gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base">장충금헌터</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">세입자 권리 찾기 솔루션</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
                  <a href="/about" className="hover:text-blue-400 transition-colors">서비스 소개</a>
                  <span className="text-slate-700">|</span>
                  <a href="/terms" className="hover:text-blue-400 transition-colors">이용약관</a>
                  <span className="text-slate-700">|</span>
                  <a href="/privacy" className="hover:text-blue-400 transition-colors">개인정보처리방침</a>
                  <span className="text-slate-700">|</span>
                  <a href="/terms#refund" className="hover:text-blue-400 transition-colors">환불정책</a>
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-slate-400 leading-relaxed">
                <div>상호명: 장충금헌터 · 대표자명: 이진영 · 사업자등록번호: 361-70-00626 · 통신판매업신고: 전자상거래 소매업</div>
                <div>사업장 주소: 대구광역시 북구 고성로 172-1, 505호(고성동2가, 삼부빌) · 대표 전화번호: 010-8381-8548 · 이메일: info@longtermrefund.site</div>
                <div>서비스 명칭: 장충금 내용증명서 서식 자동 생성 서비스 · 상품 가격: 4,900원 (VAT 포함)</div>
              </div>

              <div className="pt-2 text-[10px] text-slate-500 border-t border-slate-800/60">
                ※ 본 서비스는 전자적 서식 작성 자동화 소프트웨어이며, 법률 자문이나 법률 대리 행위를 제공하지 않습니다.
              </div>
            </div>
          </footer>
        </PHProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
