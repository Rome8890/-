import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <Link href="/" className="text-sm font-bold text-blue-600 hover:underline mb-6 inline-block">
          ← 메인으로 돌아가기
        </Link>
        
        <h1 className="text-2xl font-black text-gray-900 mb-6 pb-4 border-b border-gray-200">
          개인정보 처리방침
        </h1>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">1. 수집하는 개인정보 항목</h2>
            <p>
              장충금헌터는 서비스 제공 및 결제를 위해 아래와 같은 최소한의 개인정보를 수집합니다.<br />
              - 수집항목: 성명, 연락처(휴대폰 번호), 결제 기록, 아파트/건물명
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">2. 개인정보의 수집 및 이용목적</h2>
            <p>
              - 내용증명 서식 자동 생성 및 PDF 다운로드 서비스 제공<br />
              - 이용자 본인 확인 및 결제 서비스 처리
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">3. 개인정보의 보유 및 이용기간</h2>
            <p>
              원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 전자상거래법 등 관계법령의 규정에 의하여 보존할 필요가 있는 경우 일정한 기간 동안 보관합니다.<br />
              - 대금결제 및 재화 등의 공급에 관한 기록: 5년
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-500">
          <p>상호명: 장충금헌터 | 대표자: 이진영 | 사업자등록번호: 361-70-00626</p>
          <p>문의 메일: info@bororefund.com</p>
        </div>
      </div>
    </div>
  );
}
