'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, CheckCircle2, CreditCard, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useLanguage } from '@/lib/i18n/context';
import { LangToggle } from '@/components/LangToggle';

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eon';
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb';
const PRODUCT_ID = 'content_cert';

type PaymentMode = 'toss' | 'paypal';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', fontSize: '15px',
  border: '1.5px solid #c5c4db', borderRadius: '10px',
  outline: 'none', color: '#191c1d', background: '#fafafa',
  fontFamily: 'inherit',
};

function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#454558', marginBottom: '6px' }}>
        {label}
        {required && <span style={{ color: '#ba1a1a', marginLeft: '3px' }}>*</span>}
        {hint && <span style={{ fontWeight: 400, color: '#9a99b0', marginLeft: '6px', fontSize: '11px' }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export default function CheckoutPage() {
  const { tx } = useLanguage();
  const tc = tx.checkout;
  const [mode, setMode] = useState<PaymentMode>('toss');
  const [isPaying, setIsPaying] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [refundInfo, setRefundInfo] = useState<{ months: number; monthly: number; total: number } | null>(null);
  const [docOpen, setDocOpen] = useState(true);

  // 서류 정보 필드
  const [myName, setMyName] = useState('');
  const [myAddr, setMyAddr] = useState('');
  const [myAccount, setMyAccount] = useState('');
  const [llName, setLlName] = useState('');
  const [llAddr, setLlAddr] = useState('');
  const [aptName, setAptName] = useState('');
  const [contractStart, setContractStart] = useState('');
  const [contractEnd, setContractEnd] = useState('');

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('jcg_refund_data');
      if (raw) setRefundInfo(JSON.parse(raw));
    } catch {}
  }, []);

  // 완성도 계산 (9항목)
  const fields = [myName, myAddr, myAccount, llName, llAddr, aptName, contractStart, contractEnd];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);
  const isComplete = filled === fields.length;

  const savePdfData = () => {
    sessionStorage.setItem('jcg_user_data', JSON.stringify({
      apartmentName: aptName || '해당 아파트',
      months: refundInfo?.months ?? 24,
      monthlyAmount: refundInfo?.monthly ?? 20000,
      refundAmount: refundInfo?.total ?? 500000,
      userName: myName || '세입자',
      userAddress: myAddr,
      userAccount: myAccount,
      landlordName: llName,
      landlordAddress: llAddr,
      contractStart,
      contractEnd,
    }));
  };

  const handleTossPayment = async () => {
    setIsPaying(true);
    setOrderError('');
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: PRODUCT_ID, customerName: myName }),
      });
      const order = await res.json();
      if (!order.ok) throw new Error(order.error);
      savePdfData();
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: order.amount },
        orderId: order.orderId,
        orderName: order.orderName,
        customerName: myName || '고객',
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/checkout?payment=fail`,
      });
    } catch (e: any) {
      const msg = e?.message || '';
      if (!msg.includes('취소') && !msg.includes('cancel') && !msg.includes('CANCEL')) {
        setOrderError(msg || '결제 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: '#FDFCFB', color: '#191c1d' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 md:px-10 h-16 w-full sticky top-0 z-10"
        style={{ backgroundColor: '#FDFCFB', borderBottom: '1px solid #e1e3e4' }}
      >
        <button onClick={() => window.history.back()} className="p-2 rounded-full hover:opacity-70" style={{ color: '#0001bb' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-bold" style={{ fontSize: '18px', letterSpacing: '-0.01em', color: '#0001bb' }}>{tx.brand}</h1>
        <LangToggle />
      </header>

      <main className="px-5 pb-28 mx-auto" style={{ maxWidth: '520px' }}>

        {/* 환급금 히어로 */}
        {refundInfo && (
          <div className="flex items-center justify-between px-5 py-4 mt-5 mb-5"
            style={{ background: 'linear-gradient(135deg,#0001bb,#0000ee)', borderRadius: '16px', color: '#fff' }}>
            <div>
              <p style={{ fontSize: '11px', opacity: 0.75, marginBottom: '3px' }}>{tc.refundBannerLabel}</p>
              <p style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em' }}>
                {refundInfo.total.toLocaleString('ko-KR')}원
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', opacity: 0.8 }}>
              <div>{refundInfo.months}개월</div>
              <div>× {refundInfo.monthly.toLocaleString('ko-KR')}원/월</div>
            </div>
          </div>
        )}

        {/* ── 서류 정보 입력 섹션 ── */}
        <div style={{ borderRadius: '16px', border: '1.5px solid #e1e3e4', marginBottom: '18px', overflow: 'hidden' }}>

          {/* 섹션 헤더 (접기/펼치기) */}
          <button
            onClick={() => setDocOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4"
            style={{ background: isComplete ? '#f0fff4' : '#f8f9ff', border: 'none', cursor: 'pointer' }}
          >
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '20px' }}>✍️</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#191c1d' }}>
                  내용증명 서류 정보
                </p>
                <p style={{ fontSize: '11px', color: isComplete ? '#00732c' : '#757589', marginTop: '1px' }}>
                  {isComplete ? '✅ 모두 완성! 완전한 법적 효력의 서류가 발급됩니다' : `${filled}/${fields.length} 완성 — 더 채울수록 법적 효력이 강해집니다`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 진행 바 */}
              <div style={{ width: '40px', height: '4px', background: '#e1e3e4', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: isComplete ? '#00C853' : '#0001bb', borderRadius: '2px', transition: 'width 0.3s' }} />
              </div>
              {docOpen ? <ChevronUp size={16} style={{ color: '#757589' }} /> : <ChevronDown size={16} style={{ color: '#757589' }} />}
            </div>
          </button>

          {docOpen && (
            <div style={{ padding: '0 20px 20px', borderTop: '1px solid #e1e3e4' }}>

              {/* 나의 정보 */}
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#0001bb', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '16px 0 12px' }}>
                👤 나의 정보 (발신인)
              </p>
              <Field label="성명" required hint="서류에 표시됩니다">
                <input style={inputStyle} value={myName} onChange={e => setMyName(e.target.value)}
                  placeholder="홍길동" onFocus={e=>(e.target.style.borderColor='#0001bb')} onBlur={e=>(e.target.style.borderColor='#c5c4db')} />
              </Field>
              <Field label="주소" hint="발신인 주소 — 우체국 발송 시 필요">
                <input style={inputStyle} value={myAddr} onChange={e => setMyAddr(e.target.value)}
                  placeholder="서울시 강남구 테헤란로 123, 101동 502호" onFocus={e=>(e.target.style.borderColor='#0001bb')} onBlur={e=>(e.target.style.borderColor='#c5c4db')} />
              </Field>
              <Field label="반환받을 계좌" hint="집주인이 바로 송금할 수 있게 됩니다">
                <input style={inputStyle} value={myAccount} onChange={e => setMyAccount(e.target.value)}
                  placeholder="카카오뱅크 3333-00-0000000 (예금주: 홍길동)" onFocus={e=>(e.target.style.borderColor='#0001bb')} onBlur={e=>(e.target.style.borderColor='#c5c4db')} />
              </Field>

              {/* 집주인 정보 */}
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#0001bb', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '20px 0 12px' }}>
                🏠 집주인 정보 (수신인)
              </p>
              <Field label="집주인 성명" hint="모르면 '집주인' 으로 두셔도 됩니다">
                <input style={inputStyle} value={llName} onChange={e => setLlName(e.target.value)}
                  placeholder="김임대" onFocus={e=>(e.target.style.borderColor='#0001bb')} onBlur={e=>(e.target.style.borderColor='#c5c4db')} />
              </Field>
              <Field label="집주인 주소" required hint="우체국 발송 필수 — 등기부등본 확인">
                <input style={inputStyle} value={llAddr} onChange={e => setLlAddr(e.target.value)}
                  placeholder="서울시 서초구 반포대로 456" onFocus={e=>(e.target.style.borderColor='#0001bb')} onBlur={e=>(e.target.style.borderColor='#c5c4db')} />
                <p style={{ fontSize: '11px', color: '#ba1a1a', marginTop: '4px' }}>
                  ⚠ 집주인 주소가 없으면 우체국 발송 불가 — 등기부등본에서 확인하세요
                </p>
              </Field>

              {/* 부동산 정보 */}
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#0001bb', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '20px 0 12px' }}>
                📍 부동산 정보
              </p>
              <Field label="아파트명 + 동·호수">
                <input style={inputStyle} value={aptName} onChange={e => setAptName(e.target.value)}
                  placeholder="래미안 퍼스티지 101동 502호" onFocus={e=>(e.target.style.borderColor='#0001bb')} onBlur={e=>(e.target.style.borderColor='#c5c4db')} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Field label="계약 시작일">
                  <input style={inputStyle} value={contractStart} onChange={e => setContractStart(e.target.value)}
                    placeholder="2022.01.01" onFocus={e=>(e.target.style.borderColor='#0001bb')} onBlur={e=>(e.target.style.borderColor='#c5c4db')} />
                </Field>
                <Field label="계약 종료일">
                  <input style={inputStyle} value={contractEnd} onChange={e => setContractEnd(e.target.value)}
                    placeholder="2024.01.01" onFocus={e=>(e.target.style.borderColor='#0001bb')} onBlur={e=>(e.target.style.borderColor='#c5c4db')} />
                </Field>
              </div>

              {/* 안내 박스 */}
              <div style={{ background: '#f0f4ff', borderRadius: '10px', padding: '12px 14px', marginTop: '8px' }}>
                <p style={{ fontSize: '12px', color: '#0001bb', lineHeight: 1.7 }}>
                  💡 <strong>집주인 주소 모를 때</strong> → 등기부등본 발급 (인터넷 등기소 무료)<br/>
                  💡 <strong>계약 기간</strong> → 임대차 계약서의 시작일~종료일<br/>
                  💡 나머지 빈 항목은 결제 후 서류에서 직접 수정도 가능합니다
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 상품 요약 */}
        <div className="flex items-center justify-between px-5 py-4 mb-5"
          style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e1e3e4', boxShadow: '0 2px 12px rgba(0,0,255,0.04)' }}>
          <div className="flex items-center gap-3">
            <div style={{ background: '#e0e0ff', borderRadius: '10px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={18} style={{ color: '#0001bb' }} />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700 }}>{tc.productName}</p>
              <div className="flex flex-col gap-0.5 mt-1">
                {tc.trustItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 size={11} style={{ color: '#00C853', flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: '#757589' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#0001bb' }}>4,900원</p>
            <p style={{ fontSize: '10px', color: '#757589' }}>≈ $3.50 USD</p>
          </div>
        </div>

        {/* 결제 탭 */}
        <div className="flex gap-2 mb-4 p-1" style={{ background: '#f3f4f5', borderRadius: '12px' }}>
          {([
            { key: 'toss' as const, label: tc.tabKorean, icon: <CreditCard size={15} /> },
            { key: 'paypal' as const, label: tc.tabPaypal, icon: <Globe size={15} /> },
          ]).map(({ key, label, icon }) => (
            <button key={key} onClick={() => setMode(key)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 font-semibold transition-all"
              style={{ fontSize: '13px', borderRadius: '10px',
                background: mode === key ? '#fff' : 'transparent',
                color: mode === key ? '#0001bb' : '#757589',
                boxShadow: mode === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                border: 'none', cursor: 'pointer' }}>
              {icon}{label}
            </button>
          ))}
        </div>

        {orderError && (
          <div className="px-4 py-3 mb-4" style={{ background: '#ffdad6', borderRadius: '12px' }}>
            <p style={{ fontSize: '13px', color: '#ba1a1a' }}>{orderError}</p>
          </div>
        )}

        {/* 토스 결제 */}
        {mode === 'toss' && (
          <div>
            <button onClick={handleTossPayment} disabled={isPaying}
              className="w-full flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#0001bb,#0000ee)', color: '#fff',
                borderRadius: '16px', fontSize: '16px', padding: '18px 24px',
                boxShadow: '0 8px 24px rgba(0,0,255,0.3)', border: 'none', cursor: isPaying ? 'not-allowed' : 'pointer' }}>
              <CreditCard size={18} />
              {isPaying ? tc.tossBtnLoading : tc.tossBtn}
            </button>
            <p className="text-center mt-3" style={{ fontSize: '12px', color: '#757589' }}>{tc.tossHint}</p>
          </div>
        )}

        {/* PayPal 결제 */}
        {mode === 'paypal' && (
          <div>
            <div className="px-4 py-3 mb-4" style={{ background: '#f0f0ff', borderRadius: '12px', border: '1px solid #bec2ff' }}>
              <p style={{ fontSize: '13px', color: '#0001bb' }}>
                {tc.paypalInfo}<br /><strong>{tc.paypalAmount}</strong>
              </p>
            </div>
            <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD' }}>
              <PayPalButtons
                style={{ layout: 'vertical', color: 'gold', shape: 'pill', label: 'pay' }}
                createOrder={async () => {
                  savePdfData();
                  const res = await fetch('/api/payment/paypal/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId: PRODUCT_ID }),
                  });
                  const data = await res.json();
                  if (!data.ok) throw new Error(data.error);
                  return data.paypalOrderId;
                }}
                onApprove={async (data) => {
                  const res = await fetch('/api/payment/paypal/capture', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paypalOrderId: data.orderID }),
                  });
                  const result = await res.json();
                  if (result.ok) {
                    window.location.href = '/payment/success?paymentKey=paypal&orderId=paypal&amount=4900';
                  } else {
                    setOrderError(result.error || 'PayPal payment failed');
                  }
                }}
                onError={() => setOrderError('PayPal error occurred. Please try again.')}
              />
            </PayPalScriptProvider>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-5" style={{ color: '#c5c4db' }}>
          <ShieldCheck size={14} />
          <span style={{ fontSize: '12px' }}>{tc.security}</span>
        </div>
      </main>
    </div>
  );
}
