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
  ArrowLeft,
} from 'lucide-react';
import { useTracker } from '@/hooks/useTracker';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';

// ── 데이터 ────────────────────────────────────────────────────

const JISIKIN_QUESTIONS = [
  {
    id: 1,
    tag: '집주인 거부형',
    tagColor: 'red',
    urgency: '즉각 대응 필요',
    verdict: '집주인 말은 틀렸습니다. 법적으로 100% 돌려받을 수 있습니다.',
    title: '장기수선충당금 돌려받을 수 있나요? 집주인이 절대 못 준다고 합니다',
    body: '2년 거주하다 이사 나왔는데 집주인이 장충금은 자기 돈이라며 안 돌려준다고 합니다. 정말 못 받는 건가요? 매달 2만원 정도 납부했는데 총 48만원 정도 됩니다.',
    estimatedAmount: '648,200',
    period: '24개월',
    situation: '집주인이 반환을 거부하는 상황으로, 즉각적인 법적 대응이 필요합니다. 내용증명 발송 시 집주인은 법적으로 반환 의무가 발생합니다.',
    legalSummary: [
      {
        type: 'law' as const,
        badge: '법령',
        cite: '공동주택관리법 시행령 제31조 제7항',
        quote: '임차인이 납부한 장기수선충당금은 퇴거 시 임대인에게 반환 청구할 수 있다.',
        point: '집주인의 반환 거부는 이 조항의 명백한 위반입니다.',
      },
      {
        type: 'precedent' as const,
        badge: '대법원 판례',
        cite: '대법원 2004. 1. 27. 선고 2003다62059 판결',
        quote: '장기수선충당금은 소유자 부담 원칙 — 임차인이 납부한 경우 반환 청구권 인정.',
        point: '전국 모든 법원에서 동일하게 적용되는 확정 판례입니다.',
      },
      {
        type: 'remedy' as const,
        badge: '법적 수단',
        cite: '소액심판 청구권',
        quote: '집주인이 계속 거부할 경우 소액심판을 청구할 수 있습니다.',
        point: '인지대 단 1만원 · 평균 2~3개월 내 판결 · 임차인 승소율 95% 이상',
      },
    ],
    actionSteps: [
      { timing: '오늘', icon: '📋', action: '관리사무소 방문 → 장기수선충당금 납부확인서 발급 요청' },
      { timing: '이번 주', icon: '📮', action: '법적 근거 포함 내용증명서 집주인에게 우편 발송 (법적 효력 즉시)' },
      { timing: '7일 후', icon: '⚖️', action: '미반환 시 소액심판 청구 — 수수료 1만원, 승소율 95%+' },
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

내용증명이 필요하시다면 법적 근거가 완벽히 포함된 문서를 무료로 발급받으실 수 있습니다 👉 [장충금 헌터 무료 서비스 바로가기]`,
  },
  {
    id: 2,
    tag: '이사 준비형',
    tagColor: 'blue',
    urgency: '이사 전 반드시 확인',
    verdict: '세입자가 낼 의무가 없는 돈입니다. 이사 전에 전액 청구하세요.',
    title: '이사 나가기 전에 장기수선충당금 돌려받을 수 있나요?',
    body: '다음 달 이사 예정인데 관리비 고지서를 보니 장기수선충당금이 매달 나가고 있더라고요. 세입자가 이걸 내는 게 맞는 건가요? 이사 나가면서 돌려받을 수 있나요?',
    estimatedAmount: '412,500',
    period: '18개월',
    situation: '이사 예정으로 정보 확인이 필요한 상황입니다. 이사 전 반드시 청구해야 하며, 보증금 반환 시 함께 정산하는 것이 가장 유리합니다.',
    legalSummary: [
      {
        type: 'law' as const,
        badge: '법령',
        cite: '공동주택관리법 시행령 제31조 제7항',
        quote: '장기수선충당금은 소유자(집주인) 부담이 원칙이다.',
        point: '세입자가 대신 낸 금액 전액 — 이사 시 집주인에게 반환 청구 가능합니다.',
      },
      {
        type: 'precedent' as const,
        badge: '대법원 판례',
        cite: '대법원 2004. 1. 27. 선고 2003다62059 판결',
        quote: '거주 기간 × 월 납부액 전액이 반환 대상이다.',
        point: '단 1개월치도 빠짐없이 청구 가능 — 이사 당일 전 청구가 핵심입니다.',
      },
      {
        type: 'remedy' as const,
        badge: '이사 전 필수',
        cite: '보증금과 동시 정산 전략',
        quote: '이사 당일 보증금 반환 시 장충금을 함께 청구하는 것이 가장 유리합니다.',
        point: '이사 후 별도 청구 시 집주인이 회피할 가능성 높아 — 반드시 이사 전 청구하세요.',
      },
    ],
    actionSteps: [
      { timing: '지금 바로', icon: '📋', action: '관리사무소 방문 → 장기수선충당금 납부확인서 발급 (무료)' },
      { timing: '이사 당일', icon: '💬', action: '집주인에게 보증금 + 장충금 함께 반환 요청 (문자로 기록 남기기)' },
      { timing: '거부 시', icon: '📮', action: '내용증명서 발송 → 7일 내 반환 요구 (법적 효력 즉시 발생)' },
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
📋 이사 전 필수 체크리스트
━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ 관리사무소 → '장기수선충당금 납부확인서' 발급
2️⃣ 집주인에게 보증금 반환 시 함께 청구 (구두 + 문자)
3️⃣ 거부 시 → 내용증명 발송 (법적 효력 즉시 발생)

내용증명이 필요하시다면 법적 근거가 완벽히 포함된 문서를 무료로 발급받으실 수 있습니다 👉 [장충금 헌터 무료 서비스 바로가기]`,
  },
  {
    id: 3,
    tag: '경매 진행형',
    tagColor: 'orange' as const,
    urgency: '즉각 비대면 법적 대응',
    verdict: '경매와 별개로 미납 월세·부당이득을 청구하고 강제퇴거 절차를 진행할 수 있습니다.',
    title: '소유 아파트 경매 진행 중 임차인 미납 월세 청구 및 퇴거 방법',
    body: '소유한 아파트가 경매로 넘어가고 있는데 기존 임차인이 월세를 수개월째 미납 중입니다. 방문 없이 법적으로 처리하려면 어떻게 해야 하나요?',
    estimatedAmount: '미납액 + 연체이자',
    period: '전자소송 가능',
    situation: '경매 진행 중에도 미납 월세 청구권은 독립 존재합니다. 전자내용증명·전자소송으로 방문 없이 비대면 처리 가능합니다.',
    legalSummary: [
      {
        type: 'law' as const,
        badge: '법령',
        cite: '민법 제618조·제387조·제397조',
        quote: '임대차 계약상 임차인의 월세 지급 의무는 계속 유효하며, 연체 시 연 5% 법정이자 부과.',
        point: '경매 진행과 별개로 미납 월세 + 연체이자 전액 청구 가능합니다.',
      },
      {
        type: 'precedent' as const,
        badge: '법령',
        cite: '민법 제741조 (부당이득반환)',
        quote: '정당한 근거 없이 점유하여 얻은 이익은 반환해야 한다.',
        point: '계약 종료 후 퇴거 거부 시 부당이득 반환 + 손해배상 청구 가능합니다.',
      },
      {
        type: 'remedy' as const,
        badge: '강제집행',
        cite: '민사집행법 제258조 (부동산 인도명령)',
        quote: '법원 인도명령 결정 후 집행관이 강제퇴거를 집행한다.',
        point: '전자소송으로 비대면 신청 — 법원 방문 불필요, 평균 2~4주 처리.',
      },
    ],
    actionSteps: [
      { timing: '오늘', icon: '📧', action: '전자내용증명 발송 (카카오 알림장 앱 또는 우체국 인터넷 등기) — 10분, 소멸시효 즉시 중단' },
      { timing: '1~2일 내', icon: '⚖️', action: '전자소송(ecfs.scourt.go.kr) 지급명령 신청 — 인지대 소가의 1/10, 법원 방문 불필요' },
      { timing: '확정 후', icon: '🔒', action: '강제집행 신청 → 급여·통장 압류 + 부동산 인도명령 강제퇴거 (집행관 수수료 10만원 내외)' },
    ],
    answer: `방문이 어렵더라도 즉시 법적 절차를 시작하실 수 있습니다. 경매 진행과 관계없이 임차인의 미납 월세 및 연체이자 청구권은 독립적으로 존재합니다.

✅ 결론: 전자내용증명 + 전자소송으로 방문 없이 처리 가능합니다.

━━━━━━━━━━━━━━━━━━━━━━━
⚖️ 법적 근거
━━━━━━━━━━━━━━━━━━━━━━━
① 민법 제618조·제397조: 미납 월세 원금 + 연 5% 법정이자 청구 가능 (판결 후 연 12%)
② 민법 제741조(부당이득반환): 계약 종료 후 점유 기간 부당이득 추가 청구 가능
③ 민사집행법 제258조: 법원 인도명령 → 집행관 강제퇴거 집행

내용증명 발송 즉시 소멸시효가 중단되며 법적 효력이 발생합니다.`,
  },
  {
    id: 4,
    tag: '연체이자 청구형',
    tagColor: 'purple' as const,
    urgency: '연체 즉시 청구 가능',
    verdict: '미납 월세 전액 + 연 5% 법정이자(판결 후 연 12%)까지 즉시 청구할 수 있습니다.',
    title: '임차인이 월세를 수개월 미납 중입니다. 연체이자까지 청구하고 퇴거시킬 수 있나요?',
    body: '세입자가 월세를 3개월째 안 내고 있습니다. 연체이자도 받을 수 있는지, 방문하지 않고 법적으로 처리하는 방법을 알고 싶습니다.',
    estimatedAmount: '미납액 + 연체이자',
    period: '2개월 연체 시 계약해지 가능',
    situation: '월세 2회 이상 연체 시 계약 해지 통보가 가능합니다. 전자소송으로 비대면 처리가 가능합니다.',
    legalSummary: [
      {
        type: 'law' as const,
        badge: '법령',
        cite: '민법 제397조 + 소송촉진법 제3조',
        quote: '금전채무 이행지체 시 법정이율 연 5%, 판결 확정 후 연 12% 적용.',
        point: '미납 월세 원금 + 연 5% → 판결 후 연 12%로 자동 증가합니다.',
      },
      {
        type: 'precedent' as const,
        badge: '법령',
        cite: '주택임대차보호법 제6조의2',
        quote: '임차인이 2기(2개월)의 차임을 연체한 경우 임대인은 계약을 해지할 수 있다.',
        point: '2개월 이상 연체 확인 즉시 내용증명으로 계약 해지 통보 가능합니다.',
      },
      {
        type: 'remedy' as const,
        badge: '강제집행',
        cite: '민사집행법 제258조 + 형법 제327조',
        quote: '지급명령 확정 후 재산 압류, 퇴거 거부 시 강제집행면탈죄 고소 가능.',
        point: '전자소송으로 비대면 처리 — 평균 2주 만에 집행권원 확보 가능.',
      },
    ],
    actionSteps: [
      { timing: '오늘', icon: '📧', action: '전자내용증명: 계약 해지 통보 + 7일 내 퇴거 및 미납액 반환 요구' },
      { timing: '3~5일 내', icon: '⚖️', action: '전자소송 지급명령 신청: 미납액 + 연체이자 전액 (인지대 소가의 1/10)' },
      { timing: '미이행 시', icon: '🔒', action: '강제집행 + 부동산 인도명령 → 집행관 강제퇴거 (집행관 수수료 10만원 내외)' },
    ],
    answer: `미납 월세 전액과 연 5% 법정이자(판결 후 연 12%)까지 즉시 청구하실 수 있습니다. 방문 없이 전자소송으로 처리 가능합니다.

✅ 결론: 2개월 연체 → 계약 해지 + 미납액 + 연체이자 전액 청구 가능합니다.

━━━━━━━━━━━━━━━━━━━━━━━
⚖️ 법적 근거
━━━━━━━━━━━━━━━━━━━━━━━
① 주택임대차보호법 제6조의2: 2기 연체 시 즉시 계약 해지 가능
② 민법 제397조: 연체이자 연 5% (법정이율)
③ 소송촉진법 제3조: 판결 확정 후 연 12%로 자동 상향
④ 형법 제327조: 퇴거 거부·재산 은닉 시 강제집행면탈죄 고소 가능

전자내용증명 발송 → 전자소송 지급명령 → 강제집행 순서로 방문 없이 진행됩니다.`,
  },
];

// ── 문서 타입별 내용증명 정보 ─────────────────────────────────

function getDocInfo(id: number) {
  if (id <= 2) return {
    title: '장기수선충당금\n반환 청구서',
    subtitle: '우체국 내용증명 직접 발송 가능',
    items: [
      { icon: '📄', label: '정식 내용증명서', sub: '우체국 등기·법원 제출 즉시 사용 가능한 법적 문서' },
      { icon: '⚖️', label: '대법원 판례 인용', sub: '2003다62059 확정 판례 직접 인용 포함' },
      { icon: '📋', label: '공동주택관리법 근거', sub: '시행령 제31조 제7항 조문 명시' },
      { icon: '📮', label: '7일 이내 반환 요구 조항', sub: '미이행 시 법적 조치 예고문 포함' },
    ],
  };
  if (id === 3) return {
    title: '임차인 권리 보호\n내용증명서',
    subtitle: '경매 진행 중 비대면 법적 대응 문서',
    items: [
      { icon: '📄', label: '미납 월세 청구서', sub: '원금 + 연 5% 법정이자 포함 — 우체국·법원 즉시 사용' },
      { icon: '⚖️', label: '부당이득반환 청구 근거', sub: '민법 제741조 직접 인용 포함' },
      { icon: '🔒', label: '강제퇴거 예고 조항', sub: '민사집행법 제258조 인도명령 신청 예고 포함' },
      { icon: '📮', label: '소멸시효 중단 효력', sub: '발송 즉시 소멸시효 중단 (민법 제174조)' },
    ],
  };
  return {
    title: '미납 월세·연체이자\n청구서',
    subtitle: '전자소송 연동 비대면 처리 문서',
    items: [
      { icon: '📄', label: '계약 해지 통보서', sub: '주택임대차보호법 제6조의2 근거 — 즉시 법적 효력' },
      { icon: '⚖️', label: '연체이자 계산서 포함', sub: '연 5% 법정이율 → 판결 후 연 12% 자동 반영' },
      { icon: '🔒', label: '강제퇴거 집행 예고', sub: '민사집행법 제258조 부동산 인도명령 예고 포함' },
      { icon: '📮', label: '7일 내 이행 요구 조항', sub: '미이행 시 강제집행면탈죄(형법 제327조) 고소 예고' },
    ],
  };
}

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eon';

// ── UI 컴포넌트 ───────────────────────────────────────────────

const PrimaryButton = ({ children, onClick, className, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`bg-gradient-to-r from-[#00A3FF] to-[#0066FF] text-white font-black py-5 px-8 rounded-2xl shadow-[0_10px_30px_rgba(0,163,255,0.3)] hover:shadow-[0_15px_40px_rgba(0,163,255,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

const InputField = ({ label, placeholder, value, onChange, type = 'text', suffix }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-base font-bold text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00A3FF]/30 focus:border-[#00A3FF] transition-all"
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

// ── ResultView 컴포넌트 ───────────────────────────────────────

function ResultView({
  question,
  onNext,
}: {
  question: (typeof JISIKIN_QUESTIONS)[0];
  onNext: () => void;
}) {
  const tc = question.tagColor;
  const tagCls =
    tc === 'red' ? 'bg-red-100 text-red-600' :
    tc === 'orange' ? 'bg-orange-100 text-orange-600' :
    tc === 'purple' ? 'bg-purple-100 text-purple-600' :
    'bg-blue-100 text-blue-600';
  const accentCls =
    tc === 'red' ? 'bg-red-50 border-red-500' :
    tc === 'orange' ? 'bg-orange-50 border-orange-500' :
    tc === 'purple' ? 'bg-purple-50 border-purple-500' :
    'bg-blue-50 border-blue-500';
  const iconCls =
    tc === 'red' ? 'text-red-500' :
    tc === 'orange' ? 'text-orange-500' :
    tc === 'purple' ? 'text-purple-500' :
    'text-blue-500';
  const doc = getDocInfo(question.id);

  return (
    <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* 상황 유형 + 긴급도 배지 */}
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${tagCls}`}>
          {question.tag}
        </span>
        <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-orange-100 text-orange-600">
          ⚡ {question.urgency}
        </span>
      </div>

      {/* 핵심 결론 배너 */}
      <div className={`rounded-3xl p-5 border-l-4 ${accentCls}`}>
        <div className="flex items-start gap-3">
          <ShieldCheck className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconCls}`} />
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${iconCls}`}>
              AI 법령 분석 결론
            </p>
            <p className="font-black text-sm text-gray-900 leading-relaxed">
              {question.verdict}
            </p>
          </div>
        </div>
      </div>

      {/* 법령 핵심요약 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Scale className="w-4 h-4 text-gray-400" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">법령 · 판례 핵심요약</p>
        </div>
        {question.legalSummary.map((item, i) => {
          const badgeStyle =
            item.type === 'law' ? 'bg-indigo-100 text-indigo-700' :
            item.type === 'precedent' ? 'bg-emerald-100 text-emerald-700' :
            'bg-amber-100 text-amber-700';
          const borderStyle =
            item.type === 'law' ? 'border-indigo-100' :
            item.type === 'precedent' ? 'border-emerald-100' :
            'border-amber-100';
          return (
            <div key={i} className={`bg-white rounded-2xl border ${borderStyle} shadow-sm overflow-hidden`}>
              <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${badgeStyle}`}>
                  {item.badge}
                </span>
                <p className="text-xs font-black text-gray-800 leading-tight">{item.cite}</p>
              </div>
              <div className="mx-4 mb-2 px-3 py-2 bg-gray-50 rounded-xl border-l-2 border-gray-300">
                <p className="text-xs text-gray-600 font-medium leading-relaxed italic">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>
              <div className="px-4 pb-4 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 font-medium leading-relaxed">{item.point}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 지금 당장 해야 할 행동 단계 */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 border border-white/20 shadow-sm space-y-3">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">지금 당장 해야 할 일</p>
        {question.actionSteps.map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0">{s.icon}</span>
            <div>
              <span className="text-[10px] font-black text-[#00A3FF] bg-blue-50 px-2 py-0.5 rounded-full">
                {s.timing}
              </span>
              <p className="text-xs text-gray-700 font-medium leading-relaxed mt-1">{s.action}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 신뢰 배지 바 */}
      <div className="flex items-center justify-between bg-white/60 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/30">
        {[
          { icon: '🏛️', text: '법원 제출 서식' },
          { icon: '📮', text: '우체국 직발송 가능' },
          { icon: '✅', text: '법무사 검수 완료' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-1.5">
            <span className="text-sm">{icon}</span>
            <span className="text-[10px] font-black text-gray-600">{text}</span>
          </div>
        ))}
      </div>

      {/* 내용증명 PDF CTA */}
      <div className="rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        {/* 문서 헤더 */}
        <div className="bg-gradient-to-r from-[#0A0F1E] to-[#111827] px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="ml-2 text-[10px] text-white/40 font-mono">{doc.subtitle}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">내용증명 PDF 즉시 발급</p>
              <h3 className="text-white font-black text-lg leading-tight whitespace-pre-line">{doc.title}</h3>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-white/35 text-[10px] line-through">법무사 의뢰 30~50만원</p>
              <p className="text-[#00A3FF] font-black text-2xl">2,900원</p>
            </div>
          </div>
        </div>

        {/* 포함 내용 */}
        <div className="bg-[#0D1420] px-6 py-4 space-y-2.5">
          {doc.items.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="text-base w-6 text-center flex-shrink-0">{d.icon}</span>
              <div>
                <p className="text-white text-xs font-black leading-none">{d.label}</p>
                <p className="text-white/40 text-[10px] font-medium mt-0.5">{d.sub}</p>
              </div>
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400 ml-auto flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* 신뢰 수치 + CTA 버튼 */}
        <div className="bg-[#111827] px-6 pt-4 pb-6 space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { val: '95%+', label: '법적 승소율' },
              { val: '즉시', label: '효력 발생' },
              { val: '10초', label: '발급 완료' },
            ].map(({ val, label }) => (
              <div key={label} className="bg-white/5 rounded-2xl py-2.5 px-1">
                <p className="text-[#00A3FF] font-black text-base">{val}</p>
                <p className="text-white/40 text-[9px] font-bold mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onNext}
            className="w-full bg-gradient-to-r from-[#00A3FF] to-[#0066FF] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2.5 shadow-[0_8px_30px_rgba(0,163,255,0.4)] active:scale-95 transition-all text-base"
          >
            <CreditCard className="w-5 h-5" />
            내용증명 PDF 지금 받기 — 2,900원
          </button>

          <div className="flex items-center justify-center gap-3 text-[10px] text-white/30 font-medium">
            <span>카카오페이</span><span>·</span>
            <span>토스페이</span><span>·</span>
            <span>신용/체크카드</span>
          </div>
        </div>
      </div>

    </motion.div>
  );
}

// ── 앱 타입 ───────────────────────────────────────────────────

type AppStep = 'HOME' | 'SENDING' | 'SENT' | 'INPUT' | 'RESULT';

interface UserInfo {
  apartmentName: string;
  months: string;
  monthlyAmount: string;
  userName: string;
}

// ── 메인 앱 ───────────────────────────────────────────────────

function JangChungGeumApp() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<AppStep>('HOME');
  const [selectedQuestion, setSelectedQuestion] = useState<(typeof JISIKIN_QUESTIONS)[0] | null>(null);
  const [sendError, setSendError] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    apartmentName: '',
    months: '',
    monthlyAmount: '',
    userName: '',
  });
  const [isPaying, setIsPaying] = useState(false);
  const { track } = useTracker();

  // 지식인 링크로 유입 → 바로 RESULT
  useEffect(() => {
    const from = searchParams.get('from');
    const qid = searchParams.get('qid');
    if (from === 'jisikin' && qid) {
      const q = JISIKIN_QUESTIONS.find((q) => q.id === parseInt(qid));
      if (q) {
        setSelectedQuestion(q);
        setStep('RESULT');
      }
    }
    if (searchParams.get('payment') === 'fail') {
      alert('결제가 취소되었습니다.');
    }
  }, [searchParams]);

  // 실제 환급액 계산
  const actualRefund = (() => {
    const m = parseInt(userInfo.months) || 0;
    const a = parseInt(userInfo.monthlyAmount.replace(/,/g, '')) || 0;
    return m * a;
  })();

  const isInputValid = parseInt(userInfo.months) > 0 && parseInt(userInfo.monthlyAmount.replace(/,/g, '')) > 0;

  const getServiceLink = (qid: number) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/?from=jisikin&qid=${qid}`;
  };

  const handleSelectQuestion = async (q: (typeof JISIKIN_QUESTIONS)[0]) => {
    setSelectedQuestion(q);
    setStep('SENDING');
    setSendError(false);
    track('click_calculate');

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
    } catch {
      setSendError(true);
    }
    setStep('SENT');
  };

  const handlePayment = async () => {
    if (!isInputValid || !selectedQuestion) return;
    setIsPaying(true);
    track('click_payment');

    const months = parseInt(userInfo.months);
    const monthlyAmount = parseInt(userInfo.monthlyAmount.replace(/,/g, ''));

    // 결제 전 사용자 정보 저장 (리다이렉트 후 복구용)
    sessionStorage.setItem('jcg_user_data', JSON.stringify({
      apartmentName: userInfo.apartmentName || '해당 아파트',
      months,
      monthlyAmount,
      refundAmount: actualRefund,
      userName: userInfo.userName || '세입자',
    }));

    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: 2900 },
        orderId: `jcg_${Date.now()}`,
        orderName: '장충금 헌터 내용증명 PDF',
        customerName: userInfo.userName || '세입자',
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/?payment=fail`,
      });
    } catch (e) {
      console.error('Payment error:', e);
      setIsPaying(false);
    }
  };

  const formatNumber = (val: string) => val.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#1D1D1F] overflow-hidden selection:bg-[#00A3FF] selection:text-white">
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#00A3FF]/10 blur-[120px] rounded-full z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#FF0080]/5 blur-[100px] rounded-full z-0" />

      <main className="relative z-10 max-w-lg mx-auto px-6 pt-12 pb-24">
        <AnimatePresence mode="wait">

          {/* ── HOME ── */}
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

          {/* ── SENDING ── */}
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

          {/* ── SENT ── */}
          {step === 'SENT' && selectedQuestion && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className={`rounded-3xl p-6 text-center space-y-3 ${sendError ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${sendError ? 'bg-red-100' : 'bg-green-100'}`}>
                  {sendError ? <span className="text-3xl">😱</span> : <CheckCheck className="w-8 h-8 text-green-600" />}
                </div>
                <h2 className="text-2xl font-black">
                  {sendError ? '전송 실패' : '텔레그램 전송 완료!'}
                </h2>
                <p className="text-sm font-medium text-gray-600">
                  {sendError
                    ? '텔레그램 설정을 확인해주세요.'
                    : '답변과 맞춤형 링크가 전송되었습니다.\n지식인에서 붙여넣기 후 등록해 주세요!'}
                </p>
              </div>
              <PrimaryButton onClick={() => { setSelectedQuestion(null); setStep('HOME'); }} className="w-full">
                다른 유형 선택하기 <ChevronRight className="w-5 h-5" />
              </PrimaryButton>
            </motion.div>
          )}

          {/* ── RESULT: 세입자 맞춤 랜딩 ── */}
          {step === 'RESULT' && selectedQuestion && (
            <ResultView
              question={selectedQuestion}
              onNext={() => setStep('INPUT')}
            />
          )}

          {/* ── INPUT: 사용자 정보 입력 + 환급액 계산 ── */}
          {step === 'INPUT' && selectedQuestion && (
            <motion.div key="input" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep('RESULT')}
                  className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                  <h2 className="font-black text-xl">내 환급액 계산하기</h2>
                  <p className="text-xs text-gray-500 font-medium">실제 납부 내역을 입력해 정확한 금액을 확인하세요</p>
                </div>
              </div>

              {/* 입력 폼 */}
              <div className="bg-white/70 backdrop-blur-xl rounded-[32px] p-6 space-y-5 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
                <InputField
                  label="아파트명 (선택)"
                  placeholder="예: 래미안 OO아파트 101동 201호"
                  value={userInfo.apartmentName}
                  onChange={(e: any) => setUserInfo({ ...userInfo, apartmentName: e.target.value })}
                />
                <InputField
                  label="이름 (선택 — PDF에 표시)"
                  placeholder="예: 홍길동"
                  value={userInfo.userName}
                  onChange={(e: any) => setUserInfo({ ...userInfo, userName: e.target.value })}
                />
                <InputField
                  label="거주 기간 *"
                  placeholder="예: 24"
                  value={userInfo.months}
                  onChange={(e: any) => setUserInfo({ ...userInfo, months: e.target.value.replace(/\D/g, '') })}
                  type="number"
                  suffix="개월"
                />
                <InputField
                  label="월 납부액 * (관리비 고지서 확인)"
                  placeholder="예: 23,000"
                  value={userInfo.monthlyAmount}
                  onChange={(e: any) => setUserInfo({ ...userInfo, monthlyAmount: formatNumber(e.target.value) })}
                  suffix="원"
                />
              </div>

              {/* 실시간 계산 결과 */}
              <motion.div
                animate={{ scale: isInputValid ? 1 : 0.98, opacity: isInputValid ? 1 : 0.5 }}
                className="bg-gradient-to-b from-white to-blue-50 rounded-[32px] p-6 text-center space-y-2 border border-blue-100 shadow-sm"
              >
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">계산된 환급 예상액</p>
                <p className="text-5xl font-black text-[#00A3FF]">
                  {actualRefund > 0 ? `${actualRefund.toLocaleString('ko-KR')}원` : '---'}
                </p>
                {isInputValid && (
                  <p className="text-xs text-gray-500 font-medium">
                    {userInfo.months}개월 × 월 {userInfo.monthlyAmount}원
                  </p>
                )}
              </motion.div>

              {/* 결제 버튼 */}
              <PrimaryButton
                onClick={handlePayment}
                disabled={!isInputValid || isPaying}
                className="w-full"
              >
                {isPaying ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
                    />
                    결제창 열기 중...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    내용증명 PDF 받기 (2,900원)
                  </>
                )}
              </PrimaryButton>

              <div className="flex items-center justify-center gap-4 text-xs text-gray-400 font-medium">
                {['카카오페이', '토스페이', '신용/체크카드'].map((m) => (
                  <span key={m} className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-400" /> {m}
                  </span>
                ))}
              </div>

              <p className="text-center text-xs text-gray-400 font-medium">
                결제 완료 즉시 내용증명 PDF 다운로드
              </p>
            </motion.div>
          )}

        </AnimatePresence>
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
