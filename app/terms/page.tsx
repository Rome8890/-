import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <Link href="/" className="text-sm font-bold text-blue-600 hover:underline mb-6 inline-block">
          ← 메인으로 돌아가기
        </Link>
        
        <h1 className="text-2xl font-black text-gray-900 mb-6 pb-4 border-b border-gray-200">
          장충금헌터 이용약관
        </h1>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">제 1 조 (목적)</h2>
            <p>
              본 약관은 장충금헌터(이하 "회사")가 제공하는 장기수선충당금 자동 계산 및 내용증명 서식 자동 생성 서비스(이하 "서비스")의 이용조건 및 절차, 이용자와 회사의 권리, 의무, 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">제 2 조 (서비스의 내용 및 요금)</h2>
            <p>
              1. 회사가 제공하는 서비스는 사용자가 입력한 정보를 바탕으로 법적 관련 법령 및 서식을 자동 생성해 주는 소프트웨어 서비스입니다.<br />
              2. 서비스 이용 요금은 건당 4,900원(부가세 포함)이며, 결제 완료 즉시 PDF 다운로드 기능이 제공됩니다.
            </p>
          </section>

          <section id="refund">
            <h2 className="text-base font-bold text-gray-900 mb-2">제 3 조 (환불 정책)</h2>
            <p>
              1. 결제 완료 후 시스템 오류 등으로 인해 PDF 문서 생성이 정상적으로 완료되지 아니한 경우, 결제 금액 전액을 즉시 환불 처리해 드립니다.<br />
              2. 디지털 콘텐츠 특성상 PDF 생성이 완료되고 정상 다운로드된 이후에는 단순 변심으로 인한 환불이 제한될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">제 4 조 (법적 면책 고지)</h2>
            <p>
              본 서비스는 관련 법령과 대법원 판례에 기한 자동 문서 서식 생성 도구이며, 변호사법상 개별적인 법률 대리나 맞춤형 법률 자문을 제공하지 않습니다.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-500">
          <p>상호명: 장충금헌터 | 대표자: 이진영 | 사업자등록번호: 361-70-00626</p>
          <p>주소: 대구광역시 북구 고성로 172-1, 505호</p>
        </div>
      </div>
    </div>
  );
}
