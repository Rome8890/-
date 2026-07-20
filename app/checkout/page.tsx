'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, CreditCard, Globe, CheckCircle2 } from 'lucide-react';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eon';
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb';
const PRODUCT_ID = 'content_cert';

const TRUST_ITEMS = [
  '법적 효력 있는 내용증명 PDF 즉시 발급',
  '공동주택관리법 제30조 근거 조항 자동 포함',
  '집주인 반환 거부 시 소액심판 근거 자료',
  '결제 후 즉시 다운로드 가능',
];

type PaymentMode = 'toss' | 'paypal';

export default function CheckoutPage() {
  const [mode, setMode] = useState<PaymentMode>('toss');
  const [isPaying, setIsPaying] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [orderError, setOrderError] = useState('');
  const [refundInfo, setRefundInfo] = useState<{ months: number; monthly: number; total: number } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('jcg_refund_data');
      if (raw) setRefundInfo(JSON.parse(raw));
    } catch {}
  }, []);

  const createTossOrder = async () => {
    setOrderError('');
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: PRODUCT_ID, customerName }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      return data;
    } catch (e: any) {
      setOrderError(e.message || '주문 생성 실패');
      return null;
    }
  };

  const handleTossPayment = async () => {
    setIsPaying(true);
    try {
      const order = await createTossOrder();
      if (!order) return;
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: order.amount },
        orderId: order.orderId,
        orderName: order.orderName,
        customerName: customerName || '고객',
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/checkout?payment=fail`,
      });
    } catch (e: any) {
      const msg = e?.message || '';
      if (!msg.includes('취소') && !msg.includes('cancel') && !msg.includes('CANCEL')) {
        setOrderError(msg || '결제 오류가 발생했습니다.');
      }
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: '#FDFCFB', color: '#191c1d' }}>
      {/* Header */}
      <header
        className="flex items-center gap-4 px-5 md:px-10 h-16 w-full"
        style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e1e3e4' }}
      >
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-full transition-opacity hover:opacity-70"
          style={{ color: '#0001bb' }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-bold" style={{ fontSize: '22px', letterSpacing: '-0.01em', color: '#0001bb' }}>
          Boro Refund
        </h1>
      </header>

      <main className="px-5 md:px-10 pt-8 pb-24 mx-auto" style={{ maxWidth: '560px' }}>
        {/* 환급금 요약 배너 */}
        {refundInfo && (
          <div
            className="flex items-center justify-between p-4 mb-6"
            style={{ background: '#f0f0ff', borderRadius: '12px', border: '1px solid #bec2ff' }}
          >
            <div>
              <p style={{ fontSize: '12px', color: '#454558', marginBottom: '2px' }}>내 예상 환급액</p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: '#0001bb' }}>
                {refundInfo.total.toLocaleString('ko-KR')}원
              </p>
            </div>
            <div style={{ fontSize: '12px', color: '#757589', textAlign: 'right' }}>
              <div>{refundInfo.months}개월</div>
              <div>× {refundInfo.monthly.toLocaleString('ko-KR')}원/월</div>
            </div>
          </div>
        )}

        <h2
          className="font-bold mb-1"
          style={{ fontSize: '26px', letterSpacing: '-0.02em', color: '#191c1d' }}
        >
          내용증명 PDF 받기
        </h2>
        <p style={{ fontSize: '14px', color: '#454558', marginBottom: '24px' }}>
          결제 후 즉시 다운로드 · 집주인에게 직접 발송 가능
        </p>

        {/* 상품 카드 */}
        <div
          className="p-5 mb-6"
          style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e1e3e4', boxShadow: '0 4px 20px rgba(0,0,255,0.05)' }}
        >
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#e0e0ff' }}
            >
              <FileText className="w-6 h-6" style={{ color: '#0001bb' }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ fontSize: '16px', color: '#191c1d' }}>장충금 헌터 내용증명 PDF</p>
              <p style={{ fontSize: '13px', color: '#757589', marginTop: '2px' }}>법적 효력 있는 반환 청구 문서</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p className="font-bold" style={{ fontSize: '22px', color: '#0001bb' }}>2,900원</p>
              <p style={{ fontSize: '11px', color: '#757589', marginTop: '2px' }}>1회 결제</p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e1e3e4', paddingTop: '16px' }} className="space-y-2">
            {TRUST_ITEMS.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#00C853' }} />
                <span style={{ fontSize: '13px', color: '#454558' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 이름 입력 */}
        <div className="mb-5">
          <label className="block mb-2 font-semibold" style={{ fontSize: '14px', color: '#191c1d' }}>
            이름 (선택 — PDF에 표시)
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="예: 홍길동"
            style={{
              width: '100%', padding: '12px 16px', fontSize: '16px',
              border: '1.5px solid #c5c4db', borderRadius: '12px',
              outline: 'none', color: '#191c1d', background: '#fafafa',
            }}
            onFocus={e => (e.target.style.borderColor = '#0001bb')}
            onBlur={e => (e.target.style.borderColor = '#c5c4db')}
          />
        </div>

        {/* 결제 수단 탭 */}
        <div
          className="flex gap-2 mb-5 p-1"
          style={{ background: '#f3f4f5', borderRadius: '12px' }}
        >
          {([
            { key: 'toss', label: '국내 결제', icon: <CreditCard className="w-4 h-4" /> },
            { key: 'paypal', label: '해외 결제 (PayPal)', icon: <Globe className="w-4 h-4" /> },
          ] as const).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 font-semibold transition-all"
              style={{
                fontSize: '14px',
                borderRadius: '10px',
                background: mode === key ? '#ffffff' : 'transparent',
                color: mode === key ? '#0001bb' : '#757589',
                boxShadow: mode === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* 오류 */}
        {orderError && (
          <div
            className="px-4 py-3 mb-4"
            style={{ background: '#ffdad6', borderRadius: '12px', border: '1px solid #ffb4ab' }}
          >
            <p style={{ fontSize: '14px', color: '#ba1a1a' }}>{orderError}</p>
          </div>
        )}

        {/* Toss 결제 */}
        {mode === 'toss' && (
          <div>
            <button
              onClick={handleTossPayment}
              disabled={isPaying}
              className="w-full flex items-center justify-center gap-2 py-4 font-semibold transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: '#0000ff',
                color: '#ffffff',
                borderRadius: '9999px',
                fontSize: '16px',
                boxShadow: '0 8px 16px rgba(0,0,255,0.2)',
                cursor: isPaying ? 'not-allowed' : 'pointer',
              }}
            >
              <CreditCard className="w-5 h-5" />
              {isPaying ? '결제창 여는 중...' : '2,900원 결제하기'}
            </button>
            <p className="text-center mt-3" style={{ fontSize: '12px', color: '#757589' }}>
              카카오페이 · 토스페이 · 신용/체크카드 지원
            </p>
          </div>
        )}

        {/* PayPal 결제 */}
        {mode === 'paypal' && (
          <div>
            <div
              className="px-4 py-3 mb-4"
              style={{ background: '#fff8e1', borderRadius: '12px', border: '1px solid #ffe082' }}
            >
              <p style={{ fontSize: '13px', color: '#78350f' }}>
                해외 카드 또는 PayPal 계정으로 결제합니다. 결제 금액: USD $2.50
              </p>
            </div>
            <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD' }}>
              <PayPalButtons
                style={{ layout: 'vertical', color: 'gold', shape: 'pill', label: 'pay' }}
                createOrder={async () => {
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
                    window.location.href = '/payment/success';
                  } else {
                    setOrderError(result.error || 'PayPal 결제 실패');
                  }
                }}
                onError={() => {
                  setOrderError('PayPal 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                }}
              />
            </PayPalScriptProvider>
          </div>
        )}

        {/* 보안 안내 */}
        <div className="flex items-center justify-center gap-2 mt-8" style={{ color: '#757589' }}>
          <ShieldCheck className="w-4 h-4" />
          <span style={{ fontSize: '12px' }}>결제 정보는 암호화되어 안전하게 처리됩니다</span>
        </div>
      </main>
    </div>
  );
}
