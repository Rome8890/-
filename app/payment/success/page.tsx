'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, ArrowRight } from 'lucide-react';
import { generateKoreanPDF, type PDFData } from '@/lib/pdf';

type Status = 'verifying' | 'success' | 'error';

function SuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('verifying');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [userData, setUserData] = useState<PDFData | null>(null);

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (!paymentKey || !orderId || !amount) {
      setStatus('error');
      return;
    }

    const raw = sessionStorage.getItem('jcg_user_data');
    const user: PDFData = raw ? JSON.parse(raw) : {
      apartmentName: '해당 아파트',
      months: 12,
      monthlyAmount: 20000,
      refundAmount: 240000,
      userName: '세입자',
    };
    setUserData(user);

    fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setPaymentMethod(data.paymentMethod || '카드');
          setStatus('success');
          sessionStorage.removeItem('jcg_user_data');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [searchParams]);

  const handleDownloadPDF = () => {
    if (userData) generateKoreanPDF(userData);
  };

  if (status === 'verifying') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0F4F8] gap-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-14 h-14 rounded-full border-4 border-[#00A3FF]/20 border-t-[#00A3FF]"
        />
        <p className="font-black text-xl text-gray-700">결제 확인 중...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0F4F8] gap-4 px-6">
        <div className="text-5xl">😱</div>
        <h2 className="text-2xl font-black">결제 확인 실패</h2>
        <p className="text-gray-500 text-sm font-medium text-center">
          결제는 완료됐으나 확인 중 오류가 발생했습니다.<br />
          고객센터로 문의해 주세요.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="mt-4 bg-gray-900 text-white font-black px-6 py-3 rounded-2xl"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        {/* 결제 완료 헤더 */}
        <div className="bg-white rounded-[40px] p-8 text-center space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
          <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-black">결제 완료!</h1>
          <p className="text-gray-500 font-medium text-sm">
            {paymentMethod}으로 2,900원 결제가 완료되었습니다.<br />
            내용증명 PDF를 지금 바로 다운로드하세요.
          </p>
          {userData && (
            <div className="bg-blue-50 rounded-2xl p-4 text-left space-y-1">
              <p className="text-xs font-black text-blue-700">청구 내역</p>
              <p className="font-black text-[#00A3FF] text-xl">
                {userData.refundAmount.toLocaleString('ko-KR')}원 환급 청구
              </p>
              <p className="text-xs text-gray-500 font-medium">
                {userData.apartmentName} · {userData.months}개월 거주
              </p>
            </div>
          )}
        </div>

        {/* PDF 다운로드 버튼 */}
        <button
          onClick={handleDownloadPDF}
          className="w-full bg-gradient-to-r from-[#00A3FF] to-[#0066FF] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(0,163,255,0.3)] active:scale-95 transition-all"
        >
          <Download className="w-5 h-5" />
          내용증명 PDF 다운로드
        </button>

        {/* 안내 */}
        <div className="bg-white/70 rounded-3xl p-5 space-y-3 border border-white/20">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">다음 단계</p>
          {[
            '관리사무소에서 장기수선충당금 납부확인서 발급',
            'PDF 출력 후 집주인에게 내용증명 우편 발송',
            '7일 내 미반환 시 소액심판 청구 (수수료 1만원)',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 bg-[#00A3FF] text-white text-[10px] font-black rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => window.location.href = '/'}
          className="w-full flex items-center justify-center gap-2 text-gray-400 font-bold text-sm py-3"
        >
          홈으로 <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0F4F8]" />}>
      <SuccessContent />
    </Suspense>
  );
}
