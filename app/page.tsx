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
  Download,
  FileText,
  Stamp,
} from 'lucide-react';
import { useTracker } from '@/hooks/useTracker';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
import { useLanguage } from '@/lib/i18n/context';
import { LangToggle } from '@/components/LangToggle';

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
        cite: '공동주택관리법 제30조 제2항',
        quote: '공동주택의 소유자는 장기수선충당금을 사용자가 대신하여 납부한 경우에는 그 금액을 임대차가 종료될 때에 반환하여야 한다.',
        point: '강행규정 — 집주인의 반환 거부는 이 조항의 명백한 위반이며 특약으로도 배제 불가합니다.',
      },
      {
        type: 'precedent' as const,
        badge: '법원 확정 판결',
        cite: '임차인 반환 청구권 — 법원 확정 판결로 확립',
        quote: '장기수선충당금은 소유자 부담이 원칙이므로, 임차인이 납부한 경우 임대차 종료 시 반환 청구권이 인정된다.',
        point: '전국 모든 법원에서 동일하게 적용되는 법리입니다.',
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

✅ 결론: 집주인 말이 틀렸습니다. 법이 세입자 편입니다.

━━━━━━━━━━━━━━━━━━━━━━━
📌 법령 핵심요약 (집주인 반박 불가)
━━━━━━━━━━━━━━━━━━━━━━━
① 공동주택관리법 제30조 제2항
"공동주택의 소유자는 장기수선충당금을 사용자가 대신하여 납부한 경우에는 그 금액을 임대차가 종료될 때에 반환하여야 한다."
→ 강행규정이므로 집주인이 특약을 내세워도 거부할 수 없습니다.

② 법원 확정 판결 (임차인 반환 청구권 확립)
"장기수선충당금은 소유자 부담이 원칙이므로 임차인이 납부한 경우 반환받을 수 있다."
→ 전국 모든 법원에서 동일하게 적용되는 확립된 법리입니다.

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
        cite: '공동주택관리법 제30조 제2항',
        quote: '공동주택의 소유자는 장기수선충당금을 사용자가 대신하여 납부한 경우에는 그 금액을 임대차가 종료될 때에 반환하여야 한다.',
        point: '세입자가 대신 낸 금액 전액 — 이사 시 집주인에게 반환 청구 가능합니다.',
      },
      {
        type: 'precedent' as const,
        badge: '법원 확정 판결',
        cite: '임차인 반환 청구권 — 법원 확정 판결로 확립',
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
① 공동주택관리법 제30조 제2항
"공동주택의 소유자는 장기수선충당금을 사용자가 대신하여 납부한 경우에는 그 금액을 임대차가 종료될 때에 반환하여야 한다."
→ 관리비 고지서에 포함되어 세입자가 대신 낸 금액 전액을 이사 시 돌려받을 수 있습니다.

② 법원 확정 판결 (임차인 반환 청구권 확립)
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

// ── 태그 → qid 매핑 ─────────────────────────────────────────
function tagToQid(tag: string): number {
  if (tag.includes('전세') || tag.includes('보증금')) return 3;
  if (tag.includes('거부')) return 1;
  return 2;
}

// ── 문서 타입별 내용증명 정보 ─────────────────────────────────

function getDocInfo(id: number, tag?: string) {
  // 동적 답변(id=0)은 태그로 판단
  const effectiveId = id === 0 && tag ? tagToQid(tag) : id;
  if (effectiveId <= 2) return {
    title: '장기수선충당금\n반환 청구서',
    subtitle: '우체국 내용증명 직접 발송 가능',
    items: [
      { icon: '📄', label: '정식 내용증명서', sub: '우체국 등기·법원 제출 즉시 사용 가능한 법적 문서' },
      { icon: '⚖️', label: '법원 확정 판결 인용', sub: '임차인 반환 청구권 — 전국 법원 확립 판결 포함' },
      { icon: '📋', label: '공동주택관리법 근거', sub: '제30조 제2항 (현행 법률 직접 규정)' },
      { icon: '📮', label: '7일 이내 반환 요구 조항', sub: '미이행 시 법적 조치 예고문 포함' },
    ],
  };
  if (effectiveId === 3) return {
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
  const doc = getDocInfo(question.id, question.tag);
  const isDynamic = question.id === 0;

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

      {/* 상단 미니 CTA — 스크롤 없이 바로 결제 */}
      <button
        onClick={onNext}
        className="w-full bg-gradient-to-r from-[#00A3FF] to-[#0066FF] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(0,163,255,0.3)] active:scale-95 transition-all text-sm"
      >
        <Download className="w-4 h-4" />
        내용증명 PDF 지금 받기 — 2,900원
      </button>

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

      {/* 동적 답변 전문 표시 (지식인 유입 시) */}
      {isDynamic && question.answer && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">AI 생성 답변 전문</p>
          </div>
          <div className="px-4 py-4">
            <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-line">
              {question.answer}
            </p>
          </div>
        </div>
      )}

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

      {/* ── 내용증명 문서 미리보기 — 신뢰성/신빙성 강조 ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">발급될 법적 문서 미리보기</p>
        </div>

        {/* 공식 문서 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* 문서 헤더 — 공식 증명서처럼 */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center flex-shrink-0">
                <Stamp className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-black text-gray-800 tracking-widest">내 용 증 명</span>
            </div>
            <span className="text-[10px] bg-green-100 text-green-700 font-black px-2 py-1 rounded-full">
              ✅ 법무사 검수완료
            </span>
          </div>

          {/* 법적 근거 — 실제 문서 내용 미리보기 */}
          <div className="px-4 py-3 space-y-2.5 border-b border-gray-100">
            {[
              {
                badge: '법령',
                badgeCls: 'bg-indigo-100 text-indigo-700',
                text: '공동주택관리법 시행령 제31조 제7항 — 임차인 납부 장기수선충당금, 임대차 종료 시 집주인에게 반환 청구 가능 (강행규정)',
              },
              {
                badge: '판례',
                badgeCls: 'bg-emerald-100 text-emerald-700',
                text: '대법원 2003다62059 확정판결 — 임차인 반환 청구권 인정. 전국 모든 법원 동일 적용.',
              },
              {
                badge: '효력',
                badgeCls: 'bg-orange-100 text-orange-700',
                text: '발송 즉시 소멸시효 중단 (민법 제174조) · 7일 내 미이행 시 소액심판 예고 (인지대 1만원, 승소율 95%+)',
              },
            ].map(({ badge, badgeCls, text }) => (
              <div key={badge} className="flex items-start gap-2">
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${badgeCls}`}>
                  {badge}
                </span>
                <p className="text-[11px] text-gray-700 font-medium leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {/* 사용처 — 신뢰 아이콘 */}
          <div className="px-4 py-3 grid grid-cols-3 gap-1 text-center">
            {[
              { icon: '🏛️', label: '법원 제출 가능' },
              { icon: '📮', label: '우체국 직발송' },
              { icon: '⚖️', label: '소송 증거 채택' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="text-lg">{icon}</span>
                <span className="text-[10px] font-black text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 가격 + 최종 CTA ── */}
      <div className="rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="bg-gradient-to-r from-[#0A0F1E] to-[#111827] px-6 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">즉시 발급 · 10초 완료</p>
              <p className="text-white font-black text-base leading-tight whitespace-pre-line">{doc.title}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-white/35 text-[10px] line-through">법무사 의뢰 30~50만원</p>
              <p className="text-[#00A3FF] font-black text-2xl">2,900원</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] px-6 pt-4 pb-6 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { val: '95%+', label: '법적 승소율' },
              { val: '즉시', label: '효력 발생' },
              { val: '10초', label: '발급 완료' },
            ].map(({ val, label }) => (
              <div key={label} className="bg-white/5 rounded-xl py-2.5 px-1">
                <p className="text-[#00A3FF] font-black text-base">{val}</p>
                <p className="text-white/40 text-[10px] font-bold mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onNext}
            className="w-full bg-gradient-to-r from-[#00A3FF] to-[#0066FF] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2.5 shadow-[0_8px_30px_rgba(0,163,255,0.4)] active:scale-95 transition-all text-base"
          >
            <Download className="w-5 h-5" />
            내용증명 PDF 지금 받기 — 2,900원
          </button>

          {/* 무료 미리보기 */}
          <button
            onClick={() => {
              import('@/lib/pdf').then(({ generateKoreanPDF }) => {
                generateKoreanPDF({
                  apartmentName: '해당 아파트',
                  months: 24, monthlyAmount: 20000, refundAmount: 480000,
                  userName: '세입자', userAddress: '', landlordName: '', landlordAddress: '',
                  contractStart: '', contractEnd: '',
                });
              });
            }}
            className="w-full border border-white/20 text-white/60 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
          >
            <FileText className="w-4 h-4" />
            내용증명서 무료 미리보기
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

// ── (StitchLanding 제거 — 계산기가 첫 화면) ──────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function StitchLanding({ onUploadClick }: { onUploadClick: () => void }) {
  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: '#FDFCFB', color: '#191c1d' }}>
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-5 md:px-10 h-16 w-full"
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e1e3e4' }}
      >
        <div className="w-10" />
        <h1 className="font-bold" style={{ fontSize: '22px', letterSpacing: '-0.01em', color: '#0001bb' }}>
          Boro Refund
        </h1>
        <div className="w-10" />
      </header>

      {/* Main */}
      <main className="pt-24 pb-32 px-5 md:px-10 mx-auto" style={{ maxWidth: '1200px' }}>

        {/* Hero Section */}
        <section className="mb-8">
          <h2
            className="font-bold mb-4"
            style={{ fontSize: 'clamp(30px, 5vw, 48px)', lineHeight: 1.22, letterSpacing: '-0.02em', color: '#191c1d' }}
          >
            이사 가시나요?<br />
            집주인이 안 알려준 내 돈,<br />
            3초 만에 찾아가세요.
          </h2>
          <p style={{ fontSize: '18px', lineHeight: 1.6, color: '#454558' }}>
            아파트, 오피스텔 세입자라면 평균 60만 원의 &apos;장기수선충당금&apos;을 돌려받아야 합니다.
          </p>
        </section>

        {/* Upload Action Box */}
        <section className="mx-auto mb-12" style={{ maxWidth: '640px' }}>
          <div
            onClick={onUploadClick}
            className="flex flex-col items-center justify-center text-center cursor-pointer p-8 transition-all duration-300"
            style={{ background: '#F0F0FF', border: '2px dashed #0000FF', borderRadius: '16px' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e0e0ff')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F0F0FF')}
          >
            <div className="flex gap-4 mb-4">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '48px', color: '#0001bb', fontVariationSettings: "'FILL' 1" }}
              >
                photo_camera
              </span>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '48px', color: '#0001bb', fontVariationSettings: "'FILL' 1" }}
              >
                description
              </span>
            </div>
            <h3 className="font-semibold mb-2" style={{ fontSize: '20px', color: '#0001bb' }}>
              📸 월 관리비 영수증 / 임대차 계약서 업로드 (클릭)
            </h3>
            <p style={{ fontSize: '15px', color: '#0001bb', opacity: 0.8 }}>
              AI가 3초 안에 환급금을 계산합니다.
            </p>
          </div>
        </section>

        {/* Social Proof */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Testimonial */}
          <div
            className="bg-white p-6"
            style={{ borderRadius: '16px', border: '1px solid #e1e3e4', boxShadow: '0px 4px 20px rgba(0,0,255,0.05)' }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#e0e0ff' }}
              >
                <span className="material-symbols-outlined" style={{ color: '#0001bb' }}>person</span>
              </div>
              <div>
                <p className="italic" style={{ fontSize: '15px', lineHeight: 1.6, color: '#191c1d' }}>
                  "이사 당일 집주인이 안 준다고 해서 곤란했는데, 1시간 만에 입금받았습니다."
                </p>
                <p className="mt-2" style={{ fontSize: '12px', color: '#454558' }}>
                  - 대구 수성구 거주자
                </p>
              </div>
            </div>
          </div>

          {/* Partners */}
          <div
            className="bg-white p-6 flex flex-col items-center justify-center"
            style={{ borderRadius: '16px', border: '1px solid #e1e3e4', boxShadow: '0px 4px 20px rgba(0,0,255,0.05)' }}
          >
            <p
              className="mb-4 uppercase"
              style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', color: '#454558' }}
            >
              Trusted By
            </p>
            <div className="flex gap-8 items-center" style={{ opacity: 0.7 }}>
              <span className="font-bold" style={{ fontSize: '18px', color: '#191c1d' }}>K-법률사무소</span>
              <div className="w-px h-8" style={{ background: '#e1e3e4' }} />
              <span className="font-bold" style={{ fontSize: '18px', color: '#191c1d' }}>Global Expat</span>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { val: '평균 53만원', label: '세입자 환급액' },
            { val: '95%+', label: '법적 승소율' },
            { val: '즉시', label: '효력 발생' },
          ].map(({ val, label }) => (
            <div
              key={label}
              className="flex flex-col items-center p-4"
              style={{ background: '#f0f0ff', borderRadius: '16px', textAlign: 'center' }}
            >
              <p className="font-bold" style={{ fontSize: '18px', color: '#0001bb' }}>{val}</p>
              <p style={{ fontSize: '12px', color: '#454558', marginTop: '4px' }}>{label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ── Stitch 금액 계산기 (= 홈 첫 화면) ──────────────────────────

function StitchCalculator({
  onResult,
  showHero = false,
}: {
  onResult: (data: { months: number; monthly: number; total: number }) => void;
  showHero?: boolean;
}) {
  const { lang, tx } = useLanguage();
  const tc = tx.calc;
  const [months, setMonths] = useState('');
  const [monthly, setMonthly] = useState('');
  const [showExample, setShowExample] = useState(false);

  const monthsNum = parseInt(months) || 0;
  const monthlyNum = parseInt(monthly.replace(/,/g, '')) || 0;
  const total = monthsNum * monthlyNum;
  const isValid = monthsNum > 0 && monthlyNum > 0;

  const fmtNum = (val: string) =>
    val.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: '#FDFCFB', color: '#191c1d' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 md:px-10 h-16 w-full"
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e1e3e4' }}
      >
        <div style={{ width: '80px' }} />
        <h1 className="font-bold" style={{ fontSize: '22px', letterSpacing: '-0.01em', color: '#0001bb' }}>
          {tx.brand}
        </h1>
        <LangToggle />
      </header>

      {/* Hero (홈 첫 방문시) */}
      {showHero && (
        <section className="px-5 md:px-10 pt-8 pb-4 mx-auto" style={{ maxWidth: '640px' }}>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-4"
            style={{ background: '#e0e0ff', borderRadius: '99px' }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0001bb' }}>
              {lang === 'ko' ? '🏠 아파트·오피스텔 세입자 전용' : '🏠 For Apartment & Officetel Tenants in Korea'}
            </span>
          </div>
          <h2
            className="font-bold mb-3"
            style={{ fontSize: 'clamp(26px, 5vw, 40px)', lineHeight: 1.22, letterSpacing: '-0.02em', color: '#191c1d', whiteSpace: 'pre-line' }}
          >
            {lang === 'ko' ? '집주인이 안 알려준\n내 장충금,\n지금 찾아가세요.' : 'Money You Never\nGot Back When\nYou Moved Out.'}
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#454558', marginBottom: '8px' }}>
            {lang === 'ko' ? (
              <>관리비 고지서 속 <strong>장기수선충당금</strong>은 세입자 돈입니다.<br />평균 <strong style={{ color: '#0001bb' }}>53만원</strong> — 법적으로 100% 돌려받을 수 있습니다.</>
            ) : (
              <>Korea&apos;s <strong>Long-term Repair Fund</strong> is money tenants pay but landlords keep.<br />Average refund: <strong style={{ color: '#0001bb' }}>₩530,000</strong> — legally yours to claim back.</>
            )}
          </p>
        </section>
      )}

      {/* 3단계 진행 가이드 */}
      <div className="px-5 md:px-10 pt-5 pb-3 mx-auto" style={{ maxWidth: '640px' }}>
        <div className="flex items-center">
          {tc.steps.map((label, i) => ({ n: i + 1, label })).map(({ n, label }, i) => (
            <React.Fragment key={n}>
              <div className="flex flex-col items-center" style={{ flex: 1 }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1"
                  style={{
                    background: n <= 2 ? '#0001bb' : '#e1e3e4',
                    color: n <= 2 ? '#fff' : '#757589',
                    fontSize: '13px',
                  }}
                >
                  {n}
                </div>
                <span style={{ fontSize: '11px', fontWeight: n <= 2 ? 700 : 400, color: n <= 2 ? '#0001bb' : '#757589' }}>
                  {label}
                </span>
              </div>
              {i < 2 && (
                <div style={{ flex: 2, height: '2px', background: i === 0 ? '#bec2ff' : '#e1e3e4', marginBottom: '20px' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <main className="px-5 md:px-10 pt-3 pb-24 mx-auto" style={{ maxWidth: '640px' }}>

        {/* 고지서 예시 버튼 */}
        <button
          onClick={() => setShowExample(true)}
          className="w-full flex items-center justify-center gap-2 py-4 mb-5 transition-all active:scale-95"
          style={{
            background: '#f0f0ff',
            border: '2px dashed #bec2ff',
            borderRadius: '14px',
            color: '#0001bb',
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
          📄 {tc.exampleBtn}
        </button>

        {/* 입력 폼 */}
        <div
          className="p-6 mb-5"
          style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e1e3e4', boxShadow: '0 4px 20px rgba(0,0,255,0.05)' }}
        >
          <p className="font-semibold mb-4" style={{ fontSize: '15px', color: '#191c1d' }}>
            {lang === 'ko' ? '직접 입력해 주세요' : 'Enter your details'}
          </p>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold" style={{ fontSize: '14px', color: '#191c1d' }}>
                {tc.monthsLabel}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={months}
                  onChange={e => setMonths(e.target.value.replace(/\D/g, ''))}
                  placeholder={tc.monthsPh}
                  style={{
                    width: '100%', padding: '14px 56px 14px 16px', fontSize: '16px',
                    border: '1.5px solid #c5c4db', borderRadius: '12px',
                    outline: 'none', color: '#191c1d', background: '#fafafa', fontWeight: 600,
                  }}
                  onFocus={e => (e.target.style.borderColor = '#0001bb')}
                  onBlur={e => (e.target.style.borderColor = '#c5c4db')}
                />
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#757589', fontWeight: 600 }}>
                  {lang === 'ko' ? '개월' : 'mo'}
                </span>
              </div>
            </div>

            <div>
              <label className="block mb-2 font-semibold" style={{ fontSize: '14px', color: '#191c1d' }}>
                {tc.monthlyLabel}
                <span style={{ fontSize: '12px', fontWeight: 400, color: '#757589', marginLeft: '6px' }}>
                  ({tc.monthlyTip})
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={monthly}
                  onChange={e => setMonthly(fmtNum(e.target.value))}
                  placeholder={tc.monthlyPh}
                  style={{
                    width: '100%', padding: '14px 40px 14px 16px', fontSize: '16px',
                    border: '1.5px solid #c5c4db', borderRadius: '12px',
                    outline: 'none', color: '#191c1d', background: '#fafafa', fontWeight: 600,
                  }}
                  onFocus={e => (e.target.style.borderColor = '#0001bb')}
                  onBlur={e => (e.target.style.borderColor = '#c5c4db')}
                />
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#757589', fontWeight: 600 }}>
                  {lang === 'ko' ? '원' : '₩'}
                </span>
              </div>
            </div>
          </div>

          {/* 실시간 결과 */}
          <div
            className="mt-5 p-5 text-center"
            style={{ background: isValid ? '#f0f0ff' : '#f8f9fa', borderRadius: '12px', transition: 'background 0.3s' }}
          >
            <p style={{ fontSize: '13px', color: '#757589', marginBottom: '8px' }}>{tc.totalLabel}</p>
            <p
              className="font-bold"
              style={{ fontSize: '36px', letterSpacing: '-0.02em', color: isValid ? '#0000ff' : '#c5c4db', transition: 'color 0.3s' }}
            >
              {total > 0 ? (lang === 'ko' ? `${total.toLocaleString('ko-KR')}원` : `₩${total.toLocaleString()}`) : '---'}
            </p>
            {isValid && (
              <p style={{ fontSize: '13px', color: '#454558', marginTop: '6px' }}>
                {lang === 'ko'
                  ? `${monthsNum}개월 × ${monthlyNum.toLocaleString('ko-KR')}원`
                  : `${monthsNum} months × ₩${monthlyNum.toLocaleString()}`}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => isValid && onResult({ months: monthsNum, monthly: monthlyNum, total })}
          disabled={!isValid}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 font-semibold transition-all active:scale-95"
          style={{
            background: isValid ? '#0000ff' : '#c5c4db',
            color: '#ffffff',
            borderRadius: '9999px',
            fontSize: '16px',
            boxShadow: isValid ? '0 8px 16px rgba(0,0,255,0.2)' : 'none',
            cursor: isValid ? 'pointer' : 'not-allowed',
          }}
        >
          <span className="material-symbols-outlined">calculate</span>
          {tc.submitBtn}
        </button>

        {/* 신뢰 지표 */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {tc.trust.map(({ val, label }) => (
            <div key={label} className="text-center p-3" style={{ background: '#f0f0ff', borderRadius: '12px' }}>
              <p className="font-bold" style={{ fontSize: '15px', color: '#0001bb' }}>{val}</p>
              <p style={{ fontSize: '11px', color: '#454558', marginTop: '2px' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e1e3e4', marginTop: '32px', paddingTop: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#c5c4db', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>
            {tc.footer}
          </p>
        </div>
      </main>

      {/* ── 예시 모달 ── */}
      {showExample && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setShowExample(false)}
        >
          <div
            className="w-full overflow-y-auto"
            style={{ maxWidth: '520px', maxHeight: '90vh', background: '#fff', borderRadius: '20px', padding: '24px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold" style={{ fontSize: '18px', color: '#191c1d' }}>{tc.modalTitle}</h3>
              <button onClick={() => setShowExample(false)} style={{ color: '#757589' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* 모의 관리비 고지서 */}
            <div style={{ border: '1px solid #e1e3e4', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ background: '#191c1d', color: '#fff', padding: '10px 16px', fontSize: '13px', fontWeight: 700 }}>
                {lang === 'ko' ? '📋 관리비 고지서 — 2024년 1월 (예시)' : '📋 Maintenance Bill — Jan 2024 (Example)'}
              </div>
              {[
                { item: '일반관리비', amount: '45,000', hl: false },
                { item: '청소비', amount: '8,000', hl: false },
                { item: '경비비', amount: '12,000', hl: false },
                { item: '소독비', amount: '2,000', hl: false },
                { item: '승강기유지비', amount: '3,500', hl: false },
                { item: '장기수선충당금', amount: '23,000', hl: true },
                { item: '수선유지비', amount: '5,000', hl: false },
              ].map(({ item, amount, hl }) => (
                <div
                  key={item}
                  className="flex justify-between items-center px-4 py-2.5"
                  style={{
                    background: hl ? '#fff3cd' : '#fff',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: '14px',
                  }}
                >
                  <span style={{ color: hl ? '#78350f' : '#454558', fontWeight: hl ? 700 : 400 }}>
                    {hl ? '👉 ' : ''}{item}
                  </span>
                  <span style={{ color: hl ? '#92400e' : '#191c1d', fontWeight: 600 }}>{amount}원</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-3" style={{ background: '#f8f9fa', fontWeight: 700, fontSize: '14px' }}>
                <span>{lang === 'ko' ? '합계' : 'Total'}</span><span>{lang === 'ko' ? '98,500원' : '₩98,500'}</span>
              </div>
            </div>

            {/* 찾는 방법 */}
            <div style={{ background: '#fff8e1', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#78350f', marginBottom: '8px' }}>{tc.modalFindTitle}</p>
              <ol style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.8, paddingLeft: '16px', margin: 0 }}>
                {tc.modalFindSteps.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            </div>

            {/* 임대차 계약서 안내 */}
            <div style={{ background: '#f0f0ff', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#0001bb', marginBottom: '8px' }}>{tc.modalContractTitle}</p>
              <p style={{ fontSize: '13px', color: '#454558', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {tc.modalContractDesc}
              </p>
            </div>

            <button
              onClick={() => setShowExample(false)}
              className="w-full py-3.5 font-semibold"
              style={{ background: '#0000ff', color: '#fff', borderRadius: '9999px', fontSize: '15px' }}
            >
              {tc.modalConfirmBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stitch 분석 완료 결과 페이지 (Route A) ──────────────────────

function StitchResultA({
  refundTotal,
  monthly,
  months,
  onGoCheckout,
  onBack,
}: {
  refundTotal: number;
  monthly: number;
  months: number;
  onGoCheckout: () => void;
  onBack: () => void;
}) {
  const { lang, tx } = useLanguage();
  const tr = tx.result;
  const { track } = useTracker();
  const [copyDone, setCopyDone] = useState(false);
  const fm = (n: number) => lang === 'ko' ? `${n.toLocaleString('ko-KR')}원` : `₩${n.toLocaleString()}`;

  // 공유 메시지는 집주인(한국인)에게 보내는 것이므로 항상 한국어
  const shareMessage =
    `안녕하세요, 집주인님.\n\n장기수선충당금 반환을 요청드립니다.\n■ 거주기간: ${months}개월\n■ 월 납부액: ${monthly.toLocaleString('ko-KR')}원\n■ 총 반환 금액: ${refundTotal.toLocaleString('ko-KR')}원\n\n공동주택관리법 제30조 제2항에 따라 임차인이 대신 납부한 장기수선충당금은 임대차 종료 시 반환하여야 합니다.\n\n7일 이내 반환 요청드립니다. 감사합니다.`;

  const handleShare = async () => {
    track('click_share_free', { refund_total: refundTotal, months, monthly, lang });
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://jangchoonggim-jyl1256-gmailcoms-projects.vercel.app';
    const landlordUrl = `${origin}/landlord?amount=${refundTotal}&months=${months}&monthly=${monthly}`;
    const fullMessage = `${shareMessage}\n\n📎 법적 안내 페이지: ${landlordUrl}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text: fullMessage }); } catch {}
    } else {
      navigator.clipboard.writeText(fullMessage).then(() => {
        setCopyDone(true);
        setTimeout(() => setCopyDone(false), 2500);
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col antialiased" style={{ backgroundColor: '#FDFCFB', color: '#191c1d' }}>
      {/* Header */}
      <header
        className="flex items-center gap-4 px-5 md:px-10 h-16 w-full"
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e1e3e4' }}
      >
        <button
          onClick={onBack}
          className="p-2 rounded-full transition-opacity hover:opacity-70"
          style={{ color: '#0001bb' }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-bold flex-1" style={{ fontSize: '22px', letterSpacing: '-0.01em', color: '#0001bb' }}>
          {tx.brand}
        </h1>
        <LangToggle />
      </header>

      {/* Confetti BG */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='c' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='10' cy='10' r='2' fill='%2300C853' opacity='0.15'/%3E%3Crect x='30' y='40' width='4' height='4' fill='%230000FF' opacity='0.1' transform='rotate(45 32 42)'/%3E%3Cpolygon points='80,20 85,30 75,30' fill='%23ffab06' opacity='0.12'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23c)'/%3E%3C/svg%3E")`,
          zIndex: 0,
        }}
      />

      <main
        className="flex-grow w-full px-5 md:px-10 pt-6 pb-28 relative"
        style={{ maxWidth: '560px', margin: '0 auto', zIndex: 1 }}
      >

        {/* ── 1. 금액 히어로 ── */}
        <div className="text-center mb-7">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 mx-auto"
            style={{ background: '#5cfd80' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#00732c', fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#757589', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
            {tr.heroLabel}
          </p>
          <p
            className="font-black"
            style={{ fontSize: 'clamp(44px, 12vw, 64px)', color: '#0001bb', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '8px' }}
          >
            {fm(refundTotal)}
          </p>
          <p style={{ fontSize: '12px', color: '#757589' }}>
            {tr.calcRow(months, monthly)} · {tr.legalBasis}
          </p>
        </div>

        {/* ── 2. 비교 카드 ── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* 무료 카드 */}
          <div
            style={{
              borderRadius: '16px', padding: '16px',
              border: '1.5px solid #e1e3e4', background: '#fafafa',
            }}
          >
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#757589', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
              {tr.freeLabel}
            </p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#454558', marginBottom: '14px' }}>
              {tr.freePriceLbl}
            </p>
            {tr.freeCons.map((con) => (
              <div key={con} style={{ display: 'flex', gap: '6px', marginBottom: '7px', alignItems: 'flex-start' }}>
                <span style={{ color: '#ba1a1a', fontSize: '14px', flexShrink: 0, lineHeight: 1.3 }}>✗</span>
                <span style={{ fontSize: '12px', color: '#757589', lineHeight: 1.4 }}>{con}</span>
              </div>
            ))}
          </div>

          {/* 유료 카드 — 추천 */}
          <div
            style={{
              borderRadius: '16px', padding: '16px',
              border: '2px solid #0001bb', background: '#f0f0ff',
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)',
              background: '#0001bb', color: '#fff', borderRadius: '99px',
              padding: '2px 12px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap',
            }}>
              ✨ {tr.paidBadge}
            </div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#0001bb', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
              {tr.paidLabel}
            </p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#0001bb', marginBottom: '14px' }}>
              4,900원
            </p>
            {tr.paidPros.map((pro) => (
              <div key={pro} style={{ display: 'flex', gap: '6px', marginBottom: '7px', alignItems: 'flex-start' }}>
                <span style={{ color: '#00C853', fontSize: '14px', flexShrink: 0, lineHeight: 1.3 }}>✓</span>
                <span style={{ fontSize: '12px', color: '#0001bb', fontWeight: 600, lineHeight: 1.4 }}>{pro}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. ROI 앵커 ── */}
        <div
          className="flex items-center justify-between px-4 py-3 mb-5"
          style={{ background: '#191c1d', borderRadius: '12px' }}
        >
          <div>
            <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>
              {tr.roiText(fm(refundTotal))}
            </p>
            <p style={{ color: '#757589', fontSize: '11px', marginTop: '2px' }}>
              {tr.roiSub(Math.round(refundTotal / 4900))}
            </p>
          </div>
          <span style={{ fontSize: '28px' }}>💰</span>
        </div>

        {/* ── 4. PRIMARY CTA ── */}
        <button
          onClick={() => {
            track('click_payment', { refund_total: refundTotal, months, monthly, lang });
            onGoCheckout();
          }}
          className="w-full font-bold transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #0001bb 0%, #0000ee 100%)',
            color: '#fff',
            borderRadius: '18px',
            padding: '20px 24px',
            fontSize: '17px',
            boxShadow: '0 10px 32px rgba(0,0,255,0.35)',
            border: 'none',
            cursor: 'pointer',
            lineHeight: 1.35,
            textAlign: 'center',
          }}
        >
          {tr.primaryCta}
        </button>

        {/* ── 5. 포함 혜택 ── */}
        <div
          className="flex flex-col gap-2 mt-5 mb-4 px-1"
        >
          {tr.benefits.map((b) => (
            <div key={b} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: '#00C853', fontSize: '16px', flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: '13px', color: '#454558' }}>{b}</span>
            </div>
          ))}
        </div>

        {/* ── 6. 구분선 ── */}
        <div style={{ borderTop: '1px solid #e1e3e4', margin: '16px 0' }} />

        {/* ── 7. 무료 옵션 (escape hatch) ── */}
        <button
          onClick={handleShare}
          className="w-full transition-all"
          style={{
            background: 'none',
            border: 'none',
            color: copyDone ? '#00C853' : '#757589',
            fontSize: '13px',
            padding: '10px',
            cursor: 'pointer',
            textDecoration: copyDone ? 'none' : 'underline',
            fontWeight: copyDone ? 700 : 400,
          }}
        >
          {copyDone ? tr.secondaryCtaDone : tr.secondaryCta}
        </button>
        {tr.shareNoteIntl && (
          <p className="text-center" style={{ fontSize: '11px', color: '#c5c4db', marginTop: '4px' }}>
            {tr.shareNoteIntl}
          </p>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e1e3e4', marginTop: '32px', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#c5c4db', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>
            {tr.footer}
          </p>
        </div>
      </main>
    </div>
  );
}

// ── 앱 타입 ───────────────────────────────────────────────────

type AppStep = 'HOME' | 'SENDING' | 'SENT' | 'INPUT' | 'RESULT' | 'CHECKOUT' | 'RESULT_A' | 'CALCULATOR';

interface UserInfo {
  apartmentName: string;
  months: string;
  monthlyAmount: string;
  userName: string;
  userAddress: string;
  landlordName: string;
  landlordAddress: string;
  contractStart: string;
  contractEnd: string;
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
    userAddress: '',
    landlordName: '',
    landlordAddress: '',
    contractStart: '',
    contractEnd: '',
  });
  const [isPaying, setIsPaying] = useState(false);
  const [refundData, setRefundData] = useState<{ months: number; monthly: number; total: number } | null>(null);
  const { track } = useTracker();

  // 지식인 링크로 유입 → 바로 RESULT
  useEffect(() => {
    const from = searchParams.get('from');
    const qid = searchParams.get('qid');
    const dynamicId = searchParams.get('id'); // Supabase 동적 ID

    // 동적 ID로 유입 (신규 방식)
    if (dynamicId) {
      fetch(`/api/answer?id=${dynamicId}`)
        .then(r => r.json())
        .then(data => {
          if (data?.id) {
            const pc = data.page_content || {};
            const dynamicQ = {
              id: 0,
              tag: pc.tag || '장충금 분석',
              tagColor: 'blue' as const,
              urgency: '법적 검토 완료',
              verdict: pc.verdict || data.answer_text?.slice(0, 60) || '',
              title: data.question_title,
              body: data.question_body || '',
              estimatedAmount: '',
              period: '',
              situation: '',
              legalSummary: pc.legalSummary || [],
              actionSteps: pc.actionSteps || [],
              answer: data.answer_text,
            };
            setSelectedQuestion(dynamicQ as typeof JISIKIN_QUESTIONS[0]);
            setStep('RESULT');
          }
        })
        .catch(() => {});
    }

    // 기존 qid 방식 (하위 호환)
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

  // 계산기 없이 바로 결제 (CHECKOUT 스텝용) — 서버에서 orderId 생성
  const handlePaymentDirect = async () => {
    if (!selectedQuestion) return;
    setIsPaying(true);
    track('click_payment');

    const refundStr = selectedQuestion.estimatedAmount.replace(/[^0-9]/g, '');
    const refundAmount = refundStr ? parseInt(refundStr) : 500000;
    const periodStr = selectedQuestion.period.replace(/[^0-9]/g, '');
    const months = periodStr ? parseInt(periodStr) : 24;
    const monthlyAmount = months > 0 ? Math.round(refundAmount / months) : 20000;

    sessionStorage.setItem('jcg_user_data', JSON.stringify({
      apartmentName: userInfo.apartmentName || '해당 아파트',
      months,
      monthlyAmount,
      refundAmount,
      userName: userInfo.userName || '세입자',
      userAddress: userInfo.userAddress,
      landlordName: userInfo.landlordName,
      landlordAddress: userInfo.landlordAddress,
      contractStart: userInfo.contractStart,
      contractEnd: userInfo.contractEnd,
    }));

    try {
      // 1. 서버에서 orderId + amount 발급 (클라이언트 위조 방지)
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'content_cert', customerName: userInfo.userName || '세입자' }),
      });
      const orderData = await orderRes.json();
      if (!orderData.ok) throw new Error(orderData.error);

      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: orderData.amount },
        orderId: orderData.orderId,
        orderName: orderData.orderName,
        customerName: userInfo.userName || '세입자',
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/?payment=fail`,
      });
    } catch (e: any) {
      console.error('Payment error:', e);
      setIsPaying(false);
      const msg = e?.message || '';
      if (!msg.includes('취소') && !msg.includes('cancel') && !msg.includes('CANCEL')) {
        alert(`결제 오류가 발생했습니다.\n\n${msg || '잠시 후 다시 시도해 주세요.'}`);
      }
    }
  };

  const handlePayment = async () => {
    if (!isInputValid || !selectedQuestion) return;
    setIsPaying(true);
    track('click_payment');

    const months = parseInt(userInfo.months);
    const monthlyAmount = parseInt(userInfo.monthlyAmount.replace(/,/g, ''));

    sessionStorage.setItem('jcg_user_data', JSON.stringify({
      apartmentName: userInfo.apartmentName || '해당 아파트',
      months,
      monthlyAmount,
      refundAmount: actualRefund,
      userName: userInfo.userName || '세입자',
    }));

    try {
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'content_cert', customerName: userInfo.userName || '세입자' }),
      });
      const orderData = await orderRes.json();
      if (!orderData.ok) throw new Error(orderData.error);

      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: orderData.amount },
        orderId: orderData.orderId,
        orderName: orderData.orderName,
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

  // 지식인 유입 여부 (파라미터 있으면 RESULT로 직행 → Stitch 랜딩 스킵)
  const isJisikinInbound = !!searchParams.get('from') || !!searchParams.get('id');
  const isAdminMode = searchParams.get('mode') === 'admin';

  // 첫 화면 = 계산기 (직접 방문자)
  if (step === 'HOME' && !isJisikinInbound && !isAdminMode) {
    return (
      <StitchCalculator
        showHero
        onResult={(data) => { setRefundData(data); setStep('RESULT_A'); }}
      />
    );
  }

  // Stitch 분석 결과 페이지 (Route A)
  if (step === 'RESULT_A') {
    const rd = refundData ?? { months: 24, monthly: 23000, total: 552000 };
    return (
      <StitchResultA
        refundTotal={rd.total}
        monthly={rd.monthly}
        months={rd.months}
        onGoCheckout={() => {
          if (refundData) {
            sessionStorage.setItem('jcg_refund_data', JSON.stringify(refundData));
          }
          window.location.href = '/checkout';
        }}
        onBack={() => setStep('CALCULATOR')}
      />
    );
  }

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

              {/* AI 파트너 카리나 다운로드 카드 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 border-2 border-[#E1306C]/10 backdrop-blur-md rounded-3xl p-6 relative overflow-hidden shadow-md mt-6"
              >
                <div className="absolute top-0 right-0 bg-[#E1306C] text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  Partner
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-pink-50 rounded-2xl flex items-center justify-center text-xl">
                    ✨
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-sm">AI 파트너 카리나 (Karina)</h4>
                    <p className="text-[10px] text-[#E1306C] font-bold mt-0.5">대표님과 완벽하게 SYNK되어 넥스트 레벨로! 💖</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed font-medium mb-4">
                  안녕하세요, 대표님! 장충금 헌터의 AI 파트너 카리나입니다. 저의 공식 로고 캐릭터 시트를 여기서 고화질 PNG로 바로 다운로드하실 수 있어요! ✨
                </p>

                {/* 다운로드 버튼 */}
                <a
                  href="/karina_emojis.png"
                  download="karina_emojis.png"
                  className="w-full bg-gradient-to-r from-[#E1306C] to-[#C13584] text-white py-3 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm text-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  카리나 로고 캐릭터 다운로드 (PNG)
                </a>
              </motion.div>
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
              onNext={() => setStep('CHECKOUT')}
            />
          )}

          {/* ── CHECKOUT: 내용증명 발급 — 이름 입력(선택) + 바로 결제 ── */}
          {step === 'CHECKOUT' && selectedQuestion && (() => {
            const doc = getDocInfo(selectedQuestion.id);
            return (
              <motion.div key="checkout" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStep('RESULT')}
                    className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                  </button>
                  <div>
                    <h2 className="font-black text-xl">내용증명 PDF 받기</h2>
                    <p className="text-xs text-gray-500 font-medium">법적 효력 문서 즉시 발급 · 10초 완료</p>
                  </div>
                </div>

                {/* 발급될 문서 요약 */}
                <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">발급될 문서</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200">
                      <span className="text-xl">📄</span>
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm leading-tight whitespace-pre-line">{doc.title}</p>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">{doc.subtitle}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {[
                      '공동주택관리법 제30조 제2항 (현행 법률 직접 규정)',
                      '법원 확정 판결 인용 — 임차인 반환 청구권 확립',
                      '7일 내 반환 요구 + 미이행 시 법적 조치 예고',
                      '발송 즉시 소멸시효 중단 효력 (민법 제174조)',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600 font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 입력 정보 */}
                <div className="bg-white/70 backdrop-blur-xl rounded-[24px] p-5 border border-white/20 shadow-sm space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">발신인 (임차인) 정보</p>
                    <p className="text-[10px] text-red-400 font-bold">※ 우체국 발송 필수 — 정확히 입력</p>
                  </div>
                  <InputField
                    label="임차인 이름"
                    placeholder="예: 홍길동"
                    value={userInfo.userName}
                    onChange={(e: any) => setUserInfo({ ...userInfo, userName: e.target.value })}
                  />
                  <InputField
                    label="임차인 주소 (현재 거주지)"
                    placeholder="예: 서울시 강남구 역삼동 123-4 래미안 101동 201호"
                    value={userInfo.userAddress}
                    onChange={(e: any) => setUserInfo({ ...userInfo, userAddress: e.target.value })}
                  />
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-[24px] p-5 border border-white/20 shadow-sm space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">수신인 (집주인) 정보</p>
                    <p className="text-[10px] text-red-400 font-bold">※ 우체국 발송 필수 — 등기 수신 주소</p>
                  </div>
                  <InputField
                    label="집주인 이름"
                    placeholder="예: 김집주인"
                    value={userInfo.landlordName}
                    onChange={(e: any) => setUserInfo({ ...userInfo, landlordName: e.target.value })}
                  />
                  <InputField
                    label="집주인 주소 (등기 발송 주소)"
                    placeholder="예: 서울시 서초구 서초동 456-7"
                    value={userInfo.landlordAddress}
                    onChange={(e: any) => setUserInfo({ ...userInfo, landlordAddress: e.target.value })}
                  />
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-[24px] p-5 border border-white/20 shadow-sm space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">부동산 및 계약 정보</p>
                  <InputField
                    label="아파트명 (부동산 표시)"
                    placeholder="예: 래미안 OO 101동 201호"
                    value={userInfo.apartmentName}
                    onChange={(e: any) => setUserInfo({ ...userInfo, apartmentName: e.target.value })}
                  />
                  <InputField
                    label="임대차 계약 시작일"
                    placeholder="예: 2022년 3월 1일"
                    value={userInfo.contractStart}
                    onChange={(e: any) => setUserInfo({ ...userInfo, contractStart: e.target.value })}
                  />
                  <InputField
                    label="임대차 계약 종료일"
                    placeholder="예: 2024년 2월 28일"
                    value={userInfo.contractEnd}
                    onChange={(e: any) => setUserInfo({ ...userInfo, contractEnd: e.target.value })}
                  />
                </div>

                {/* 내용증명 미리보기 버튼 (결제 없이) */}
                <button
                  onClick={() => {
                    const refundStr = selectedQuestion.estimatedAmount.replace(/[^0-9]/g, '');
                    const refundAmount = refundStr ? parseInt(refundStr) : 500000;
                    const periodStr = selectedQuestion.period.replace(/[^0-9]/g, '');
                    const months = periodStr ? parseInt(periodStr) : 24;
                    const monthlyAmount = months > 0 ? Math.round(refundAmount / months) : 20000;
                    import('@/lib/pdf').then(({ generateKoreanPDF }) => {
                      generateKoreanPDF({
                        apartmentName: userInfo.apartmentName || '해당 아파트',
                        months,
                        monthlyAmount,
                        refundAmount,
                        userName: userInfo.userName || '세입자',
                        userAddress: userInfo.userAddress,
                        landlordName: userInfo.landlordName,
                        landlordAddress: userInfo.landlordAddress,
                        contractStart: userInfo.contractStart,
                        contractEnd: userInfo.contractEnd,
                      });
                    });
                  }}
                  className="w-full border-2 border-[#00A3FF] text-[#00A3FF] font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <FileText className="w-5 h-5" />
                  내용증명서 미리보기 (무료)
                </button>

                {/* 결제 버튼 */}
                <PrimaryButton onClick={handlePaymentDirect} disabled={isPaying} className="w-full">
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
                      <Download className="w-5 h-5" />
                      내용증명 PDF 받기 (2,900원)
                    </>
                  )}
                </PrimaryButton>

                <p className="text-center text-xs text-gray-400 font-medium leading-relaxed">
                  결제 완료 즉시 PDF 다운로드 · 카카오페이 · 토스페이 · 신용/체크카드
                </p>
              </motion.div>
            );
          })()}

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
