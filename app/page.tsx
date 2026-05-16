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
  ChevronRight,
  MessageSquare,
  FileText,
  Home,
  User,
  Search,
  ArrowLeft,
  Send
} from 'lucide-react';
import { useTracker } from '@/hooks/useTracker';
import { LegalAnalysisTool } from '@/components/LegalAnalysisTool';
import { generateContentProof, generateLegalBasis } from '@/lib/pdf';

// --- UI Components ---

const GlassCard = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`bg-white/70 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[40px] cursor-pointer ${className}`}
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

// --- Main App Component ---

type AppStep = 'HOME' | 'CALC' | 'ANALYZING' | 'RESULT' | 'CHAT' | 'PAYMENT';

export default function JangChungGeumApp() {
  const [step, setStep] = useState<AppStep>('HOME');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [legalInfo, setLegalInfo] = useState<string | null>(null);
  const { track, trackPageView } = useTracker();

  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    trackPageView(step);
    if (step === 'ANALYZING' || step === 'CHAT') {
      fetch('/api/legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '장기수선충당금 반환 법적 근거' })
      })
      .then(res => res.json())
      .then(data => setLegalInfo(data.legalInfo))
      .catch(err => console.error(err));
    }
  }, [step]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const newMessages = [...chatMessages, { role: 'user' as const, content: inputMessage }];
    setChatMessages(newMessages);
    setInputMessage('');
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, legalInfo: legalInfo || "No legal info available" })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setChatMessages([...newMessages, { role: 'ai', content: data.content }]);
    } catch (err: any) {
      console.error('Chat UI Error:', err);
      setChatMessages([...newMessages, { role: 'ai', content: `죄송합니다. 오류가 발생했습니다: ${err.message}` }]);
    }
  };

  const handleDownloadPDF = (type: 'PROOF' | 'BASIS') => {
    try {
      track('click_download', { type });
    } catch (e) {
      console.warn('Tracking failed but continuing...', e);
    }

    if (!isPaid) {
      setStep('PAYMENT');
      return;
    }
    
    if (type === 'PROOF') {
      generateContentProof({
        apartment: '잠실 헬리오시티',
        amount: '648,200',
        period: '24개월',
        userName: '대표님',
        landlordName: '집주인 귀하'
      });
    } else {
      generateLegalBasis(legalInfo || "해당 법령 정보가 없습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#1D1D1F] overflow-hidden selection:bg-[#00A3FF] selection:text-white">
      {/* Background Orbs */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#00A3FF]/10 blur-[120px] rounded-full z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#FF0080]/5 blur-[100px] rounded-full z-0" />

      <main className="relative z-10 max-w-lg mx-auto px-6 pt-12 pb-24">
        <AnimatePresence mode="wait">
          
          {/* HOME SCREEN */}
          {step === 'HOME' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 text-[#00A3FF] font-black text-xs uppercase tracking-widest">
                  <Zap className="w-3 h-3 fill-current" /> Next Level Legal Tech
                </div>
                <h1 className="text-4xl font-black tracking-tight leading-tight">
                  세입자의 권리,<br/>리나가 찾아드릴게요
                </h1>
              </div>

              <div className="grid gap-6">
                <GlassCard onClick={() => setStep('CALC')} className="p-8 space-y-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600">
                    <Calculator className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">장충금 환급 계산기</h3>
                    <p className="text-sm text-gray-500 font-medium">내용증명 PDF 즉시 생성</p>
                  </div>
                  <ChevronRight className="absolute top-8 right-8 text-gray-300" />
                </GlassCard>

                <GlassCard onClick={() => setStep('CHAT')} className="p-8 space-y-4">
                  <div className="w-14 h-14 bg-purple-100 rounded-3xl flex items-center justify-center text-purple-600">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">법령 상담 & 증명서</h3>
                    <p className="text-sm text-gray-500 font-medium">AI 전문가 실시간 법률 자문</p>
                  </div>
                  <ChevronRight className="absolute top-8 right-8 text-gray-300" />
                </GlassCard>
              </div>
            </motion.div>
          )}

          {/* CALC FLOW (Input) */}
          {step === 'CALC' && (
            <motion.div key="calc" initial={{ x: 100 }} animate={{ x: 0 }} className="space-y-8">
              <button onClick={() => setStep('HOME')} className="flex items-center gap-2 text-gray-400 font-bold text-sm">
                <ArrowLeft className="w-4 h-4" /> 뒤로가기
              </button>
              <h2 className="text-3xl font-black">환급금 계산</h2>
              <div className="space-y-4">
                <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#00A3FF]">
                  <p className="text-[10px] font-black text-[#00A3FF] uppercase mb-2">Apartment</p>
                  <input type="text" placeholder="아파트 이름" className="w-full text-xl font-bold border-none p-0 focus:ring-0 bg-transparent" />
                </div>
                <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[#00A3FF]">
                  <p className="text-[10px] font-black text-[#00A3FF] uppercase mb-2">Period</p>
                  <input type="text" placeholder="거주 기간 (예: 24개월)" className="w-full text-xl font-bold border-none p-0 focus:ring-0 bg-transparent" />
                </div>
              </div>
              <PrimaryButton onClick={() => setStep('ANALYZING')} className="w-full">분석 시작하기</PrimaryButton>
            </motion.div>
          )}

          {/* ANALYZING */}
          {step === 'ANALYZING' && (
            <motion.div key="analyzing" className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
               <AnalyzingSimulator onComplete={() => setStep('RESULT')} />
               <div className="space-y-2">
                <h3 className="text-2xl font-black">데이터 매칭 중...</h3>
                <p className="text-gray-400 font-medium">K-apt 및 법제처 데이터를 분석하고 있습니다.</p>
              </div>
            </motion.div>
          )}

          {/* RESULT */}
          {step === 'RESULT' && (
            <motion.div key="result" className="space-y-6">
              <GlassCard className="p-8 text-center bg-gradient-to-b from-white to-blue-50">
                <p className="text-gray-400 font-black text-xs uppercase mb-4">환급 예상액</p>
                <h2 className="text-6xl font-black text-[#00A3FF] mb-2">648,200원</h2>
                <LegalAnalysisTool legalInfo={legalInfo} amount={648200} />
              </GlassCard>
              <PrimaryButton onClick={() => handleDownloadPDF('PROOF')} className="w-full py-6">
                내용증명 PDF 생성하기
              </PrimaryButton>
              <button onClick={() => setStep('HOME')} className="w-full text-center text-gray-400 font-bold">홈으로 이동</button>
            </motion.div>
          )}

          {/* CHAT FLOW */}
          {step === 'CHAT' && (
            <motion.div key="chat" initial={{ y: 100 }} animate={{ y: 0 }} className="space-y-6 h-[80vh] flex flex-col">
              <div className="flex items-center justify-between">
                <button onClick={() => setStep('HOME')} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
                <h2 className="text-xl font-black">법령 상담소</h2>
                <button 
                  onClick={() => handleDownloadPDF('BASIS')}
                  className="p-2 bg-white rounded-full shadow-sm text-[#00A3FF]"
                >
                  <FileText className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[40px] p-6 overflow-y-auto space-y-4 border border-white/50">
                {chatMessages.length === 0 && (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center shadow-inner">
                      <Zap className="w-10 h-10 text-[#00A3FF] fill-current" />
                    </div>
                    <p className="text-gray-500 font-bold">무엇이든 물어보세요.<br/>리나가 법적으로 답변해 드릴게요!</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-3xl font-medium text-sm ${msg.role === 'user' ? 'bg-[#00A3FF] text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none shadow-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 p-2 bg-white rounded-3xl shadow-lg">
                <input 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="질문을 입력하세요..." 
                  className="flex-1 border-none focus:ring-0 text-sm font-bold pl-4" 
                />
                <button onClick={handleSendMessage} className="w-12 h-12 bg-[#00A3FF] rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* PAYMENT MODAL (Outside AnimatePresence for reliability) */}
        {step === 'PAYMENT' && (
          <div 
            key="payment-modal"
            className="fixed inset-0 z-[100] bg-black/80 flex items-end justify-center p-4 backdrop-blur-md"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 space-y-8 shadow-2xl mb-4"
            >
              <div className="space-y-2">
                <h3 className="text-3xl font-black">프리미엄 문서 발급</h3>
                <p className="text-gray-400 font-medium">단돈 2,900원으로 수십만원의 권리를 되찾으세요.</p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    track('payment_success');
                    setIsPaid(true);
                    setStep('RESULT');
                    alert('결제가 완료되었습니다! 이제 문서를 다운로드하실 수 있습니다.');
                  }}
                  className="w-full bg-[#FEE500] text-[#3c1e1e] font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#FADA00] transition-colors"
                >
                  카카오페이로 1초 결제
                </button>
                <button 
                  onClick={() => {
                    track('payment_success');
                    setIsPaid(true);
                    setStep('RESULT');
                    alert('결제가 완료되었습니다! 이제 문서를 다운로드하실 수 있습니다.');
                  }}
                  className="w-full bg-[#0064FF] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#0052D1] transition-colors"
                >
                  토스페이로 결제
                </button>
              </div>
              
              <button 
                onClick={() => setStep('HOME')}
                className="w-full text-center text-gray-400 font-bold text-sm"
              >
                다음에 할게요
              </button>
            </motion.div>
          </div>
        )}
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
        return prev + 5;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-[#00A3FF]" />
    </div>
  );
}
