import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Scale, FileText, CheckCircle2, Building2 } from 'lucide-react';

export const metadata = {
  title: '서비스 소개 — 장충금 헌터',
  description: '장충금 헌터 서비스 개요, 주요 기능, 서비스 이용안내 및 사업자 상세정보입니다.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Top Header */}
      <header className="w-full bg-white border-b border-gray-200 py-4 px-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm">
            <ArrowLeft className="w-4 h-4" />
            메인 페이지로 돌아가기
          </Link>
          <span className="font-bold text-gray-800 text-lg">장충금 헌터</span>
        </div>
      </header>

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-blue-900 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="inline-block bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold">
            서비스 소개 (About Us)
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
            세입자의 권리, 장기수선충당금 <br className="hidden sm:block" />
            3초 만에 찾고 집주인에게 즉시 청구하세요
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-xl mx-auto">
            장충금 헌터는 아파트·오피스텔 세입자가 이사 전/후 대납한 장기수선충당금을 
            법적 근거(공동주택관리법 제30조)에 기반하여 손쉽게 환급받을 수 있도록 돕는 디지털 전문 솔루션입니다.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 space-y-12">
        {/* 서비스 개요 & 가치 */}
        <section className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            서비스 개요
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed text-sm sm:text-base">
            <p>
              대한민국 <strong>공동주택관리법 제30조 제2항</strong>에 따르면, 아파트 및 오피스텔의 장기수선충당금은 
              <strong>집주인(소유자)이 부담해야 하는 금액</strong>입니다. 그러나 대부분의 임대차 계약에서 매월 관리비 항목으로 세입자가 대납하고 있습니다.
            </p>
            <p>
              이사할 때 집주인에게 이 금액을 청구하여 돌려받아야 하지만, <strong>"몰라서 청구하지 않거나", "집주인의 반환 거부"</strong>로 인해 
              피해를 보는 세입자가 매년 수십만 명에 달합니다.
            </p>
            <p>
              <strong>장충금 헌터</strong>는 세입자가 본인의 환급 예상금액을 3초 만에 정밀 계산하고, 법적 효력을 갖춘 
              공식 내용증명서 서식을 자동으로 생성하여 집주인에게 손쉽게 청구할 수 있는 서비스를 제공합니다.
            </p>
          </div>
        </section>

        {/* 주요 기능 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold">
              01
            </div>
            <h3 className="font-bold text-gray-900 text-lg">3초 무료 자동 계산기</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              거주 기간과 월 평균 관리비를 입력하면 공동주택 관리비 통계를 기반으로 정확한 장충금 환급액을 무료로 계산해 드립니다.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
              02
            </div>
            <h3 className="font-bold text-gray-900 text-lg">내용증명 서식 자동 생성</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              공동주택관리법 제30조 및 판례 조항이 포함된 완벽한 법적 내용증명 서식을 1초 만에 PDF 문서로 자동 생성해 드립니다.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-bold">
              03
            </div>
            <h3 className="font-bold text-gray-900 text-lg">집주인 청구 가이드</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              카카오톡 및 모바일로 집주인에게 즉시 전송할 수 있는 청구 문구와 거부 시 법적 대응 가이드라인을 함께 제공합니다.
            </p>
          </div>
        </section>

        {/* 상품 및 결제 안내 */}
        <section className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            상품 안내 및 결제 방식
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-2">
              <span className="text-xs font-bold text-blue-600 uppercase">상품명</span>
              <div className="font-bold text-gray-900 text-lg">장충금 내용증명 서식 생성권</div>
              <p className="text-gray-600 text-sm">개인 맞춤형 장기수선충당금 청구 내용증명서 PDF 생성 및 다운로드 서비스</p>
            </div>
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-2">
              <span className="text-xs font-bold text-blue-600 uppercase">판매 가격</span>
              <div className="font-bold text-gray-900 text-lg">4,900원 <span className="text-xs text-gray-500 font-normal">(VAT 포함)</span></div>
              <p className="text-gray-600 text-sm">신용카드, 체크카드, 간편결제 (NHN KCP 정식 결제망 연동)</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs sm:text-sm text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              환불 및 소비자 보호 정책
            </div>
            <p>
              디지털 서식 상품 특성상 생성이 완료된 후에는 원칙적으로 환불이 제한될 수 있으나, 
              시스템 오류로 인해 문서 생성이 불가하거나 서식에 결함이 발생한 경우 고객센터 문의 시 100% 즉시 환불 조치해 드립니다.
            </p>
          </div>
        </section>

        {/* 사업자 정보 (PG 심사 필수 정보 완벽 명시) */}
        <section className="bg-gray-900 text-gray-200 p-8 rounded-2xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-4">
            <Scale className="w-5 h-5 text-blue-400" />
            사업자 정보 (Company Information)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400 block text-xs">상호명</span>
              <span className="font-semibold text-white">장충금헌터 (Jang-chung-geum Hunter)</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs">대표자명</span>
              <span className="font-semibold text-white">대표: 이진영</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs">사업자등록번호</span>
              <span className="font-semibold text-white">361-70-00626</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs">통신판매업신고</span>
              <span className="font-semibold text-white">전자상거래 소매업</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs">전화번호 (고객센터)</span>
              <span className="font-semibold text-white">전화번호: 010-8381-8548</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs">대표 이메일</span>
              <span className="font-semibold text-white">info@longtermrefund.site</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-gray-400 block text-xs">사업장 주소</span>
              <span className="font-semibold text-white">대구광역시 북구 고성로 172-1, 505호(고성동2가, 삼부빌)</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-200 py-8 text-center text-xs text-gray-500">
        <p>© 2026 장충금헌터. All rights reserved.</p>
      </footer>
    </div>
  );
}
