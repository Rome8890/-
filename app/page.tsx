'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  ArrowRight, 
  CheckCircle2, 
  CreditCard, 
  TrendingUp, 
  ShieldCheck,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useTracker } from '@/hooks/useTracker';

// --- UI Components (Premium Design) ---

const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`bg-white/70 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[40px] ${className}`}
  >
    {children}
  </motion.div>
);

const PrimaryButton = ({ children, onClick, className }: any) => (
  <button 
    onClick={onClick}
    className={`bg-gradient-to-r from-[#00A3FF] to-[#0066FF] text-white font-black py-5 px-8 rounded-2xl shadow-[0_10px_30px_rgba(0,163,255,0.3)] hover:shadow-[0_15px_40px_rgba(0,163,255,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 ${className}`}
  >
    {children}
  </button>
);

import { LegalAnalysisTool } from '@/components/LegalAnalysisTool';

// --- Main App Component ---

export default function JangChungGeumMVP() {
  const [step, setStep] = useState<'LANDING' | 'CALC' | 'ANALYZING' | 'RESULT' | 'PAYMENT'>('LANDING');
  const { track, trackPageView } = useTracker();

  const [legalInfo, setLegalInfo] = useState<string | null>(null);

  useEffect(() => {
    trackPageView(step);
    if (step === 'ANALYZING') {
      // 1. 법률 데이터 가져오기
      fetch('/api/legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '장기수선충당금 반환' })
      })
      .then(res => res.json())
      .then(data => {
        setLegalInfo(data.legalInfo);
      })
      .catch(err => console.error("Legal fetch error:", err));
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#1D1D1F] overflow-hidden selection:bg-[#00A3FF] selection:text-white">
      {/* Background Orbs */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#00A3FF]/10 blur-[120px] rounded-full z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#FF0080]/5 blur-[100px] rounded-full z-0" />

      <main className="relative z-10 max-w-lg mx-auto px-6 pt-12 pb-24">
        <AnimatePresence mode="wait">
          
          {/* LANDING SCREEN */}
          {step === 'LANDING' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-8"
            >
              <div className="space-y-4 text-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 text-[#00A3FF] font-black text-xs uppercase tracking-widest"
                >
                  <Zap className="w-3 h-3 fill-current" /> 10초 만에 끝나는 생돈 환급
                </motion.div>
                <h1 className="text-5xl font-black tracking-tight leading-[1.1]">
                  못 받은 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A3FF] to-[#0066FF]">장충금</span><br/>
                  수십만원 찾아드려요
                </h1>
                <p className="text-gray-500 font-medium text-lg px-4">
                  이사할 때 깜빡하고 버린 내 돈,<br/>전국 아파트 데이터를 통해 정확히 계산합니다.
                </p>
              </div>

              <GlassCard className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-tighter mb-1">Today's Payout</p>
                    <p className="text-2xl font-black">4,281,400원</p>
                  </div>
                  <div className="w-12 h-12 bg-[#00A3FF]/10 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-[#00A3FF]" />
                  </div>
                </div>
                <PrimaryButton onClick={() => setStep('CALC')} className="w-full">
                  내 환급금 확인하기 <ChevronRight className="w-5 h-5" />
                </PrimaryButton>
              </GlassCard>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white/40 rounded-3xl border border-white/50">
                  <ShieldCheck className="w-6 h-6 text-green-500 mb-3" />
                  <p className="font-bold text-sm">법적 근거 완벽</p>
                  <p className="text-[10px] text-gray-400">시행령 제31조 제7항</p>
                </div>
                <div className="p-6 bg-white/40 rounded-3xl border border-white/50">
                  <CreditCard className="w-6 h-6 text-purple-500 mb-3" />
                  <p className="font-bold text-sm">즉시 발급</p>
                  <p className="text-[10px] text-gray-400">PDF 청구서 10초 완성</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* CALC SCREEN */}
          {step === 'CALC' && (
            <motion.div 
              key="calc"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8"
            >
              <h2 className="text-3xl font-black leading-tight">
                어디 사시나요?<br/>
                <span className="text-gray-400">정확한 계산을 위해 필요해요</span>
              </h2>
              
              <div className="space-y-4">
                <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#00A3FF] transition-all">
                  <p className="text-[10px] font-black text-[#00A3FF] uppercase mb-2">Apartment Name</p>
                  <input 
                    type="text" 
                    placeholder="아파트 이름을 입력하세요"
                    className="w-full text-xl font-bold border-none p-0 focus:ring-0 bg-transparent"
                  />
                </div>
              </div>

              <div className="fixed bottom-10 left-6 right-6">
                <PrimaryButton 
                  onClick={() => {
                    track('click_calculate');
                    setStep('ANALYZING');
                  }} 
                  className="w-full"
                >
                  분석 시작하기
                </PrimaryButton>
              </div>
            </motion.div>
          )}

          {/* ANALYZING SCREEN */}
          {step === 'ANALYZING' && (
            <motion.div 
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="w-32 h-32 border-4 border-dashed border-[#00A3FF] rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Calculator className="w-12 h-12 text-[#00A3FF]" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black">법률 데이터 분석 중...</h3>
                <p className="text-gray-400 font-medium">법제처 실시간 판례 및 시행령을 매칭하고 있습니다.</p>
              </div>
              <AnalyzingSimulator onComplete={() => setStep('RESULT')} />
            </motion.div>
          )}

          {/* RESULT SCREEN */}
          {step === 'RESULT' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <GlassCard className="p-8 text-center bg-gradient-to-b from-white to-blue-50">
                <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-4">환급 예상액</p>
                <motion.h2 
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="text-6xl font-black text-[#00A3FF] mb-2"
                >
                  648,200원
                </motion.h2>
                <p className="text-gray-500 font-bold mb-8">잠실 헬리오시티 84㎡ / 24개월 거주 기준</p>
                
                <LegalAnalysisTool legalInfo={legalInfo} amount={648200} />
              </GlassCard>

              <div className="space-y-3">
                <PrimaryButton 
                  onClick={() => {
                    track('click_payment');
                    setStep('PAYMENT');
                  }} 
                  className="w-full py-6"
                >
                  정식 청구서(PDF) 발급받기
                </PrimaryButton>
                <p className="text-center text-[10px] text-gray-400 font-bold">
                  * 발급 시 법적 효력이 있는 공동주택관리법 근거가 포함됩니다.
                </p>
              </div>

              {/* Chat Button (FAB) */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-10 right-6 w-14 h-14 bg-[#1D1D1F] text-white rounded-full shadow-2xl flex items-center justify-center z-50"
                onClick={() => alert('AI 법률 전문가와 상담을 시작합니다 (준비 중)')}
              >
                <Zap className="w-6 h-6 fill-[#00A3FF] text-[#00A3FF]" />
              </motion.button>
            </motion.div>
          )}

          {/* PAYMENT SCREEN */}
          {step === 'PAYMENT' && (
            <motion.div 
              key="payment"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center p-4 backdrop-blur-md"
            >
              <div className="bg-white w-full max-w-md rounded-[40px] p-8 space-y-8 shadow-2xl">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black">2,900원 결제</h3>
                  <p className="text-gray-400 font-medium">청구서 한 장으로 수십만원을 되찾으세요.</p>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      track('payment_success');
                      alert('결제가 완료되었습니다! PDF 다운로드를 시작합니다.');
                      setStep('RESULT');
                    }}
                    className="w-full bg-[#FEE500] text-[#3c1e1e] font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#FADA00] transition-colors"
                  >
                    카카오페이로 1초 결제
                  </button>
                  <button className="w-full bg-[#0064FF] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#0052D1] transition-colors">
                    토스페이로 결제
                  </button>
                </div>
                
                <button 
                  onClick={() => setStep('RESULT')}
                  className="w-full text-center text-gray-400 font-bold text-sm"
                >
                  다음에 할게요
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

function AnalyzingSimulator({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-[200px] h-2 bg-gray-100 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        className="h-full bg-[#00A3FF]"
      />
    </div>
  );
}
