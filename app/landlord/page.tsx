'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LandlordContent() {
  const searchParams = useSearchParams();
  const amount = parseInt(searchParams.get('amount') || '0');
  const months = parseInt(searchParams.get('months') || '0');
  const monthly = parseInt(searchParams.get('monthly') || '0');

  return (
    <div style={{ backgroundColor: '#FDFCFB', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", color: '#191c1d' }}>
      {/* Top bar */}
      <div style={{ background: '#191c1d', padding: '10px 20px', textAlign: 'center' }}>
        <p style={{ color: '#fff', fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', margin: 0 }}>
          BORO REFUND · 장기수선충당금 반환 청구 안내
        </p>
      </div>

      {/* Amount hero */}
      <div style={{ background: 'linear-gradient(135deg, #0001bb 0%, #0000ee 100%)', padding: '36px 24px', textAlign: 'center' }}>
        {amount > 0 ? (
          <>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>
              집주인님께 청구된 반환 금액
            </p>
            <p style={{ color: '#fff', fontSize: '42px', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px 0' }}>
              {amount.toLocaleString('ko-KR')}원
            </p>
            {months > 0 && monthly > 0 && (
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', margin: 0 }}>
                {months}개월 × {monthly.toLocaleString('ko-KR')}원/월
              </p>
            )}
          </>
        ) : (
          <>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>
              장기수선충당금 반환 청구 안내
            </p>
            <p style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0 }}>
              임차인이 대신 납부한 금액을 반환해 주세요
            </p>
          </>
        )}
      </div>

      <main style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 20px 80px' }}>

        {/* Law card */}
        <div style={{ background: '#f0f0ff', borderRadius: '14px', padding: '20px', marginBottom: '20px', borderLeft: '4px solid #0001bb' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#0001bb', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            관련 법령
          </p>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#191c1d', marginBottom: '10px' }}>
            공동주택관리법 제30조 제2항
          </p>
          <p style={{ fontSize: '13px', color: '#454558', lineHeight: 1.75, margin: 0 }}>
            "공동주택의 소유자는 장기수선충당금을 사용자가 대신하여 납부한 경우에는 그 금액을{' '}
            <strong style={{ color: '#0001bb' }}>임대차가 종료될 때에 반환하여야 한다.</strong>"
          </p>
        </div>

        {/* Main message */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '21px', fontWeight: 700, color: '#191c1d', lineHeight: 1.35, marginBottom: '14px' }}>
            집주인님, 세입자가 대신 납부한<br />
            장기수선충당금을 반환해 주세요.
          </h2>
          <p style={{ fontSize: '14px', color: '#454558', lineHeight: 1.8, margin: 0 }}>
            장기수선충당금은 <strong>소유자(집주인)가 부담해야 할 비용</strong>입니다.
            임대 기간 중 세입자가 관리비와 함께 대신 납부했으므로,
            임대차 종료 시 전액 반환 의무가 있습니다.
            이는 특약으로도 배제할 수 없는 <strong>강행규정</strong>입니다.
          </p>
        </div>

        {/* Steps */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e1e3e4', padding: '20px', marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#757589', marginBottom: '16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            반환 절차
          </p>
          {[
            { step: '세입자 계좌로 위 금액 이체', detail: '보증금 반환 시 함께 정산하셔도 됩니다.' },
            { step: '반환 완료 후 세입자에게 문자 확인 요청', detail: '영수증 보관 권장.' },
          ].map(({ step, detail }, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: i < 1 ? '14px' : 0 }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%', background: '#0001bb',
                color: '#fff', fontSize: '13px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {i + 1}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#191c1d', marginBottom: '2px' }}>{step}</p>
                <p style={{ fontSize: '12px', color: '#757589', margin: 0 }}>{detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div style={{ background: '#ffdad6', borderRadius: '14px', padding: '18px', marginBottom: '20px', border: '1px solid #ffb4ab' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#ba1a1a', marginBottom: '6px' }}>
            ⚠️ 미반환 시 법적 조치가 진행됩니다
          </p>
          <p style={{ fontSize: '13px', color: '#93000a', lineHeight: 1.65, margin: 0 }}>
            7일 이내 미반환 시 세입자가 내용증명을 우편 발송하고 소액심판을 청구합니다.
            <br />소액심판 <strong>임차인 승소율 95%</strong> 이상 / 법원 수수료 단 1만원
          </p>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#191c1d', marginBottom: '12px' }}>자주 묻는 질문</p>
          {[
            {
              q: '계약서에 "반환하지 않는다"는 특약이 있는데요?',
              a: '공동주택관리법 제30조는 강행규정입니다. 특약으로도 배제 불가하며 법원에서 무효로 판단됩니다.',
            },
            {
              q: '금액이 맞는지 어떻게 확인하나요?',
              a: '관리사무소에서 장기수선충당금 납부확인서를 발급받아 실제 납부액을 확인하실 수 있습니다.',
            },
            {
              q: '오피스텔·빌라에도 해당되나요?',
              a: '공동주택관리법이 적용되는 300세대 이상 아파트가 주 대상입니다. 오피스텔·빌라는 관리규약에 따라 다릅니다.',
            },
          ].map(({ q, a }, i) => (
            <div key={i} style={{ marginBottom: '10px', padding: '14px 16px', background: '#f8f9fa', borderRadius: '12px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#191c1d', marginBottom: '6px' }}>Q. {q}</p>
              <p style={{ fontSize: '13px', color: '#454558', lineHeight: 1.65, margin: 0 }}>A. {a}</p>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #e1e3e4', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#c5c4db', lineHeight: 1.7, margin: 0 }}>
            Boro Refund | 장기수선충당금 반환 청구 서비스<br />
            info@bororefund.com · 본 안내는 공동주택관리법에 근거한 합법적 청구입니다.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LandlordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FDFCFB' }} />}>
      <LandlordContent />
    </Suspense>
  );
}
