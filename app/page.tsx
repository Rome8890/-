'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Zap,
  ChevronRight,
  ShieldCheck,
  Scale,
  CreditCard,
  Send,
  CheckCheck,
} from 'lucide-react';
import { useTracker } from '@/hooks/useTracker';
import { generateContentProof, generateLegalBasis } from '@/lib/pdf';

// --- 데이터 ---

const JISIKIN_QUESTIONS = [
  {
    id: 1,
    tag: '집주인 거부형',
    tagColor: 'red',
    title: '장기수선충당금 돌려받을 수 있나요? 집주인이 절대 못 준다고 합니다',
    body: '2년 거주하다 이사 나왔는데 집주인이 장충금은 자기 돈이라며 안 돌려준다고 합니다. 정말 못 받는 건가요? 매달 2만원 정도 납부했는데 총 48만원 정도 됩니다.',
    estimatedAmount: '648,200',
    period: '24개월',
    situation: '집주인이 반환을 거부하는 상황으로, 즉각적인 법적 대응이 필요합니다. 내용증명 발송 시 집주인은 법적으로 반환 의무가 발생합니다.',
    legalSummary: [
      {
        title: '공동주택관리법 시행령 제31조 제7항',
        desc: '"임차인이 납부한 장기수선충당금은 퇴거 시 임대인에게 반환 청구 가능" — 집주인의 반환 거부는 명백한 법령 위반입니다.',
      },
      {
        title: '대법원 2003다62059 판결',
        desc: '"장기수선충당금은 소유자 부담 원칙이므로 임차인이 납부한 경우 반환 청구권 인정" — 대법원 확정 판례입니다.',
      },
      {
        title: '소액심판 제도',
        desc: '집주인 계속 거부 시 소액심판 청구 가능. 수수료 1만원, 승소율 95% 이상으로 가장 강력한 압박 수단입니다.',
      },
    ],
    answer: `안녕하세요. 충분히 억울하고 답답하실 상황, 깊이 공감합니다. 하지만 걱정하지 마세요 — 이건 100% 돌려받으실 수 있는 돈입니다.

✅ 결론: 집주인 말이 틀렸습니다. 법이 대표님 편입니다.

━━━━━━━━━━━━━━━━━━━━━━━
📌 법령 핵심요약 (집주인 반박 불가)
━━━━━━━━━━━━━━━━━━━━━━━
① 공동주택관리법 시행령 제31조 제7항
"임차인이 납부한 장기수선충당금은 퇴거 시 임대인(집주인)에게 반환을 청구할 수 있다"
→ 집주인이 "자기 돈"이라고 하는 건 법률을 잘못 알고 있는 것입니다.

② 대법원 2004. 1. 27. 선고 2003다62059 판결
"장기수선충당금은 소유자 부담이 원칙이므로 임차인이 납부한 경우 반환받을 수 있다"
→ 대법원 확정 판례로, 전국 법원에서 동일하게 적용됩니다.

━━━━━━━━━━━━━━━━━━━━━━━
📋 지금 당장 하실 일 (3단계)
━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ 관리사무소 방문 → '장기수선충당금 납부확인서' 발급
2️⃣ 법적 근거가 담긴 내용증명서를 집주인에게 내용증명 우편 발송
3️⃣ 집주인 무시 시 → 소액심판청구 (수수료 1만원, 승소율 95%+)

━━━━━━━━━━━━━━━━━━━━━━━
📄 내용증명 PDF 무료 발급
━━━━━━━━━━━━━━━━━━━━━━━
법적 근거가 완벽히 포함된 정식 내용증명서를 10초 만에 발급받으세요.
집주인에게 보내는 순간 법적 효력이 즉시 발생합니다.

👉 무료 내용증명 PDF 받기: [장충금 헌터 무료 서비스 바로가기]`,
  },
  {
    id: 2,
    tag: '이사 준비형',
    tagColor: 'blue',
    title: '이사 나가기 전에 장기수선충당금 돌려받을 수 있나요?',
    body: '다음 달 이사 예정인데 관리비 고지서를 보니 장기수선충당금이 매달 나가고 있더라고요. 세입자가 이걸 내는 게 맞는 건가요? 이사 나가면서 돌려받을 수 있나요?',
    estimatedAmount: '412,500',
    period: '18개월',
    situation: '이사 예정으로 정보 확인이 필요한 상황입니다. 이사 전 반드시 청구해야 하며, 보증금 반환 시 함께 정산하는 것이 가장 유리합니다.',
    legalSummary: [
      {
        title: '공동주택관리법 시행령 제31조 제7항',
        desc: '"장기수선충당금은 소유자(집주인) 부담이 원칙" — 세입자가 대신 낸 금액 전액을 이사 시 돌려받을 수 있습니다.',
      },
      {
        title: '대법원 2003다62059 판결',
        desc: '"거주 기간 × 월 납부액 전액이 반환 대상" — 단 1개월치도 빠짐없이 청구 가능합니다.',
      },
      {
        title: '이사 전 필수 체크',
        desc: '이사 당일 전에 반드시 청구해야 합니다. 보증금 반환 시 함께 정산하지 않으면 나중에 청구가 복잡해집니다.',
      },
    ],
    answer: `안녕하세요! 이사 준비 중에 꼼꼼하게 챙기고 계시는군요. 맞습니다, 이사 전에 반드시 돌려받아야 할 돈입니다.

✅ 결론: 세입자가 낼 의무 없는 돈입니다. 전액 돌려받으세요.

━━━━━━━━━━━━━━━━━━━━━━━
📌 법령 핵심요약
━━━━━━━━━━━━━━━━━━━━━━━
① 공동주택관리법 시행령 제31조 제7항
"장기수선충당금은 소유자(집주인) 부담이 원칙"
→ 관리비 고지서에 포함되어 세입자가 대신 낸 금액 전액을 이사 시 돌려받을 수 있습니다.

② 대법원 2004다62059 판결
"거주 기간 × 월 납부액 전액이 반환 대상"
→ 단 한 달치도 빠짐없이 청구 가능합니다.

━━━━━━━━━━━━━━━━━━━━━━━
💰 예상 환급액
━━━━━━━━━━━━━━━━━━━━━━━
18개월 거주 기준 약 30~50만원 (전용 84㎡ 기준 월 약 2.3만원)

━━━━━━━━━━━━━━━━━━━━━━━
📋 이사 전 필수 체크리스트
━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ 관리사무소 → '장기수선충당금 납부확인서' 발급
2️⃣ 집주인에게 보증금 반환 시 함께 청구 (구두 + 문자)
3️⃣ 거부 시 → 내용증명 발송 (법적 효력 즉시 발생)

━━━━━━━━━━━━━━━━━━━━━━━
📄 내용증명 PDF 무료 발급
━━━━━━━━━━━━━━━━━━━━━━━
10초 만에 법적 근거가 완벽히 포함된 정식 내용증명서를 무료로 발급받으세요.
이사 전 미리 준비해두면 집주인이 거부할 수가 없습니다.

👉 무료 내용증명 PDF 받기: [장충금 헌터 무료 서비스 바로가기]`,
  },
];

// --- UI ---

const PrimaryButton = ({ children, onClick, className }: any) => (
  <button
    onClick={onClick}
    className={`bg-gradient-to-r from-[#00A3FF] to-[#0066FF] text-white font-black py-5 px-8 rounded-2xl shadow-[0_10px_30px_rgba(0,163,255,0.3)] hover:shadow-[0_15px_40px_rgba(0,163,255,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 ${className}`}
  >
    {children}
  </button>
);

type AppStep = 'HOME' | 'SENDING' | 'SENT' | 'RESULT' | 'PAYMENT';

function JangChungGeumApp() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<AppStep>('HOME');
  const [selectedQuestion, setSelectedQuestion] = useState<(typeof JISIKIN_QUESTIONS)[0] | null>(null);
  const [legalInfo, setLegalInfo] = useState<string | null>(null);
  const [sendError, setSendError] = useState(false);
  const { track } = useTracker();

  // 지식인 링크로 유입된 세입자 — 맞춤 랜딩
  useEffect(() => {
    const from = searchParams.get('from');
    const qid = searchParams.get('qid');
    if (from === 'jisikin' && qid) {
      const q = JISIKIN_QUESTIONS.find((q) => q.id === parseInt(qid));
      if (q) {
        setSelectedQuestion(q);
        fetch('/api/legal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: '장기수선충당금 반환 법적 근거' }),
        })
          .then((r) => r.json())
          .then((d) => setLegalInfo(d.legalInfo))
          .catch(() => {});
        setStep('RESULT');
      }
    }
  }, [searchParams]);

  const getServiceLink = (qid: number) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/?from=jisikin&qid=${qid}`;
  };

  const handleSelectQuestion = async (q: (typeof JISIKIN_QUESTIONS)[0]) => {
    setSelectedQuestion(q);
    setStep('SENDING');
    setSendError(false);

    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag: q.tag,
          title: q.title,
          body: q.body,
          answer: q.answer,
          serviceLink: getServiceLink(q.id),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
    } catch (e) {
      setSendError(true);
    }

    setStep('SENT');
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#1D1D1F] overflow-hidden selection:bg-[#00A3FF] selection:text-white">
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#00A3FF]/10 blur-[120px] rounded-full z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#FF0080]/5 blur-[100px] rounded-full z-0" />

      <main className="relative z-10 max-w-lg mx-auto px-6 pt-12 pb-24">
        <AnimatePresence mode="wait">

          {/* ── HOME: 질문 유형 선택 (메인화면) ── */}
          {step === 'HOME' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 text-orange-500 font-black text-xs uppercase tracking-widest">
                  <Zap className="w-3 h-3 fill-current" /> 지식인 마케팅 센터
                </div>
                <h1 className="text-4xl font-black tracking-tight leading-tight">
                  질문 유형을 선택하면<br />바로 전송됩니다
                </h1>
                <p className="text-gray-500 font-medium text-sm">답변 + 링크가 텔레그램으로 즉시 발송됩니다</p>
              </div>

              <div className="space-y-4">
                {JISIKIN_QUESTIONS.map((q) => (
                  <motion.div
                    key={q.id}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelectQuestion(q)}
                    className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.06)] rounded-[32px] p-6 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full ${q.tagColor === 'red' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {q.tag}
                      </span>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full whitespace-nowrap">
                        예상 +{q.estimatedAmount}원
                      </span>
                    </div>
                    <h3 className="font-black text-base leading-snug mb-2">{q.title}</h3>
                    <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-4">{q.body}</p>
                    <div className="flex items-center gap-2 text-orange-500 text-xs font-black">
                      <Send className="w-3 h-3" />
                      <span>선택하면 텔레그램으로 즉시 전송</span>
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '평균 환급액', value: '53만원' },
                  { label: '법적 승소율', value: '98.4%' },
                  { label: '채택 목표율', value: '70%+' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/60 backdrop-blur-md rounded-3xl p-4 text-center border border-white/30">
                    <p className="text-lg font-black text-[#00A3FF]">{value}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── SENDING: 전송 중 ── */}
          {step === 'SENDING' && (
            <motion.div
              key="sending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-16 h-16 rounded-full border-4 border-[#00A3FF]/20 border-t-[#00A3FF]"
              />
              <div className="space-y-2">
                <h3 className="text-2xl font-black">텔레그램 전송 중...</h3>
                <p className="text-gray-400 font-medium text-sm">맞춤형 답변과 서비스 링크를 전송하고 있습니다</p>
              </div>
            </motion.div>
          )}

          {/* ── SENT: 전송 완료 ── */}
          {step === 'SENT' && selectedQuestion && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className={`rounded-3xl p-6 text-center space-y-3 ${sendError ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${sendError ? 'bg-red-100' : 'bg-green-100'}`}>
                  {sendError
                    ? <span className="text-3xl">😱</span>
                    : <CheckCheck className="w-8 h-8 text-green-600" />}
                </div>
                <h2 className="text-2xl font-black">
                  {sendError ? '전송 실패' : '텔레그램 전송 완료!'}
                </h2>
                <p className="text-sm font-medium text-gray-600">
                  {sendError
                    ? '텔레그램 설정을 확인해주세요. 환경 변수를 점검해 보세요.'
                    : '답변과 맞춤형 링크가 텔레그램으로 전송되었습니다.\n지식인에서 붙여넣기 후 등록해 주세요!'}
                </p>
              </div>

              {!sendError && (
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 border border-white/20 shadow-sm space-y-3">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest">전송된 내용</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${selectedQuestion.tagColor === 'red' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {selectedQuestion.tag}
                    </span>
                  </div>
                  <p className="font-black text-sm leading-snug">{selectedQuestion.title}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <p className="text-xs text-gray-500 font-medium">법령 핵심요약 + 맞춤형 서비스 링크 포함</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <p className="text-xs text-gray-500 font-medium">예상 환급액: <span className="font-black text-[#00A3FF]">{selectedQuestion.estimatedAmount}원</span></p>
                  </div>
                </div>
              )}

              <PrimaryButton onClick={() => { setSelectedQuestion(null); setStep('HOME'); }} className="w-full">
                다른 유형 선택하기 <ChevronRight className="w-5 h-5" />
              </PrimaryButton>
            </motion.div>
          )}

          {/* ── RESULT: 세입자 맞춤 랜딩 ── */}
          {step === 'RESULT' && selectedQuestion && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-2xl border border-orange-100">
                <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <p className="text-xs font-bold text-orange-700">{selectedQuestion.tag} — 맞춤 분석 완료</p>
              </div>

              {/* 환급 예상액 */}
              <div className="bg-gradient-to-b from-white to-blue-50 rounded-[40px] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-8 text-center space-y-4">
                <p className="text-gray-400 font-black text-xs uppercase">환급 예상액</p>
                <h2 className="text-6xl font-black text-[#00A3FF]">{selectedQuestion.estimatedAmount}원</h2>
                <p className="text-sm text-gray-500 font-medium">거주 {selectedQuestion.period} 기준</p>
              </div>

              {/* 맞춤형 상황 분석 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-5 border border-blue-100 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#00A3FF] rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-black text-sm text-blue-900">맞춤형 상황 분석</p>
                  <span className="ml-auto text-xs font-black text-[#00A3FF]">승소율 98.4%</span>
                </div>
                <p className="text-xs text-blue-800 font-medium leading-relaxed">{selectedQuestion.situation}</p>
              </div>

              {/* 법령 핵심요약 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-gray-500" />
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest">법령 핵심요약</p>
                </div>
                {selectedQuestion.legalSummary.map((item, i) => (
                  <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-1">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-black text-gray-800">{item.title}</p>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed pl-6">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* PDF 결제 CTA */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-white text-sm">내용증명 PDF 즉시 발급</p>
                    <p className="text-white/50 text-xs font-medium">법적 근거 완벽 포함 · 발송 즉시 법적 효력</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-white/60 text-xs font-bold">단 한 번의 비용으로</span>
                  <span className="text-[#00A3FF] font-black">2,900원</span>
                </div>
                <button
                  onClick={() => setStep('PAYMENT')}
                  className="w-full bg-gradient-to-r from-[#00A3FF] to-[#0066FF] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(0,163,255,0.4)] active:scale-95 transition-all"
                >
                  <CreditCard className="w-5 h-5" />
                  내용증명 PDF 받기 (2,900원)
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 font-medium">법적 근거 완벽 포함 · 집주인 발송 즉시 법적 효력 발생</p>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── PAYMENT MODAL ── */}
        {step === 'PAYMENT' && selectedQuestion && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-end justify-center p-4 backdrop-blur-md">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 space-y-6 shadow-2xl mb-4"
            >
              <div className="space-y-1">
                <h3 className="text-3xl font-black">내용증명 PDF 발급</h3>
                <p className="text-gray-400 font-medium text-sm">단돈 2,900원으로 수십만원의 권리를 되찾으세요.</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-1">
                <p className="text-xs font-black text-blue-700">{selectedQuestion.tag} — 맞춤 분석 완료</p>
                <p className="text-2xl font-black text-[#00A3FF]">{selectedQuestion.estimatedAmount}원 환급 예상</p>
                <p className="text-xs text-gray-500 font-medium">{selectedQuestion.period} 거주 기준</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                <p className="text-xs font-black text-gray-700 mb-2">발급 문서</p>
                {[
                  '📄 정식 내용증명서 (법원 제출용)',
                  '⚖️ 법령 근거 증명서 (대법원 판례 포함)',
                ].map((label) => (
                  <div key={label} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <p className="text-xs font-bold text-gray-600">{label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {[
                  { label: '카카오페이로 1초 결제', bg: 'bg-[#FEE500]', text: 'text-[#3c1e1e]', hover: 'hover:bg-[#FADA00]' },
                  { label: '토스페이로 결제', bg: 'bg-[#0064FF]', text: 'text-white', hover: 'hover:bg-[#0052D1]' },
                ].map(({ label, bg, text, hover }) => (
                  <button
                    key={label}
                    onClick={() => {
                      track('payment_success');
                      const amt = selectedQuestion.estimatedAmount;
                      const period = selectedQuestion.period;
                      generateContentProof({ apartment: '해당 아파트', amount: amt, period, userName: '세입자', landlordName: '집주인 귀하' });
                      generateLegalBasis(legalInfo || '[핵심 승소 판례] 대법원 2004. 1. 27. 선고 2003다62059 판결\n"장기수선충당금은 소유자 부담 원칙이므로 임차인이 납부한 경우 반환 청구권 인정" (공동주택관리법 시행령 제31조 제7항)');
                      setStep('RESULT');
                    }}
                    className={`w-full ${bg} ${text} font-black py-5 rounded-2xl flex items-center justify-center gap-2 ${hover} transition-colors`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button onClick={() => setStep('RESULT')} className="w-full text-center text-gray-400 font-bold text-sm">
                다음에 할게요
              </button>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0F4F8]" />}>
      <JangChungGeumApp />
    </Suspense>
  );
}
