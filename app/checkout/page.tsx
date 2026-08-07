'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, CheckCircle2, CreditCard, Globe, ChevronDown, ChevronUp, Smartphone } from 'lucide-react';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useLanguage } from '@/lib/i18n/context';
import { LangToggle } from '@/components/LangToggle';
import { Field, SectionHead, Input } from '@/components/DocFormFields';

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eon';
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb';
const PRODUCT_ID = 'content_cert';
// 토스페이먼츠 심사 완료 전까지 결제 탭에서 숨김 — 심사 통과하면 true로 되돌리기
const SHOW_TOSS_TAB = false;

type PaymentMode = 'portone' | 'payapp' | 'toss' | 'paypal';

export default function CheckoutPage() {
  const { lang, tx } = useLanguage();
  const tc = tx.checkout;
  const [mode, setMode] = useState<PaymentMode>('portone');
  const [isPaying, setIsPaying] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [recvPhone, setRecvPhone] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [refundInfo, setRefundInfo] = useState<{ months: number; monthly: number; total: number } | null>(null);
  const [docOpen, setDocOpen] = useState(true);

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

      const rawUser = sessionStorage.getItem('jcg_user_data');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.userName) setMyName(u.userName);
        if (u.userAddress) setMyAddr(u.userAddress);
        if (u.userAccount) setMyAccount(u.userAccount);
        if (u.landlordName) setLlName(u.landlordName);
        if (u.landlordAddress) setLlAddr(u.landlordAddress);
        if (u.apartmentName) setAptName(u.apartmentName);
        if (u.contractStart) setContractStart(u.contractStart);
        if (u.contractEnd) setContractEnd(u.contractEnd);
        if (u.userName && u.landlordAddress) setDocOpen(false);
      }
    } catch {}
  }, []);

  const fields = [myName, myAddr, myAccount, llName, llAddr, aptName, contractStart, contractEnd];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);
  const isComplete = filled === fields.length;

  const savePdfData = () => {
    sessionStorage.setItem('jcg_user_data', JSON.stringify({
      apartmentName: aptName || (lang === 'ko' ? '해당 아파트' : 'The Apartment'),
      months: refundInfo?.months ?? 24,
      monthlyAmount: refundInfo?.monthly ?? 20000,
      refundAmount: refundInfo?.total ?? 500000,
      userName: myName || (lang === 'ko' ? '세입자' : 'Tenant'),
      userAddress: myAddr,
      userAccount: myAccount,
      landlordName: llName,
      landlordAddress: llAddr,
      contractStart,
      contractEnd,
    }));
  };

  const handlePortonePayment = async () => {
    setOrderError('');
    if (!privacyAgreed) {
      setOrderError(lang === 'ko' ? '개인정보 수집 및 이용에 동의해 주세요.' : 'Please agree to the Collection and Use of Personal Information.');
      return;
    }
    setIsPaying(true);
    try {
      savePdfData();
      const phoneDigits = recvPhone.replace(/\D/g, '');
      const res = await fetch('/api/payment/portone/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: PRODUCT_ID,
          userContact: phoneDigits || recvPhone,
          buildingName: aptName,
          privacyAgreed,
        }),
      });
      const order = await res.json();
      if (!order.ok) throw new Error(order.error);

      const loadIamport = () => {
        return new Promise<void>((resolve, reject) => {
          if ((window as any).IMP) return resolve();
          const script = document.createElement('script');
          script.src = 'https://cdn.iamport.kr/v1/iamport.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('PortOne SDK 로드 실패'));
          document.head.appendChild(script);
        });
      };

      await loadIamport();
      const IMP = (window as any).IMP;
      const storeCode = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || 'imp00000000';
      IMP.init(storeCode);

      IMP.request_pay(
        {
          pg: 'kakaopay.TC0ONETIME',
          pay_method: 'card',
          merchant_uid: order.orderId,
          name: order.orderName,
          amount: order.amount,
          buyer_name: myName || (lang === 'ko' ? '세입자' : 'Tenant'),
          buyer_tel: phoneDigits || '010-0000-0000',
          m_redirect_url: `${window.location.origin}/payment/success?paymentKey=portone&orderId=${order.orderId}&amount=${order.amount}`,
        },
        async (rsp: any) => {
          if (rsp.success) {
            await fetch('/api/payment/portone/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imp_uid: rsp.imp_uid, merchant_uid: rsp.merchant_uid }),
            });
            window.location.href = `/payment/success?paymentKey=${rsp.imp_uid || 'portone'}&orderId=${rsp.merchant_uid}&amount=${order.amount}`;
          } else {
            setIsPaying(false);
            setOrderError(rsp.error_msg || '결제가 취소되었습니다.');
          }
        }
      );
    } catch (e: any) {
      setOrderError(e?.message || (lang === 'ko' ? '결제 오류가 발생했습니다.' : 'Payment error. Please try again.'));
      setIsPaying(false);
    }
  };

  const handleTossPayment = async () => {
    setOrderError('');
    if (!privacyAgreed) {
      setOrderError(lang === 'ko' ? '개인정보 수집 및 이용에 동의해 주세요.' : 'Please agree to the Collection and Use of Personal Information.');
      return;
    }
    setIsPaying(true);
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: PRODUCT_ID,
          customerName: myName,
          userContact: recvPhone,
          buildingName: aptName,
          privacyAgreed,
        }),
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
        setOrderError(msg || (lang === 'ko' ? '결제 오류가 발생했습니다.' : 'Payment error. Please try again.'));
      }
    } finally {
      setIsPaying(false);
    }
  };

  const handlePayappPayment = async () => {
    setOrderError('');
    if (!privacyAgreed) {
      setOrderError(lang === 'ko' ? '개인정보 수집 및 이용에 동의해 주세요.' : 'Please agree to the Collection and Use of Personal Information.');
      return;
    }
    const phoneDigits = recvPhone.replace(/\D/g, '');
    if (phoneDigits.length < 9) {
      setOrderError(lang === 'ko' ? '휴대폰 번호를 정확히 입력해 주세요.' : 'Please enter a valid phone number.');
      return;
    }
    setIsPaying(true);
    try {
      savePdfData();
      const res = await fetch('/api/payment/payapp/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: PRODUCT_ID,
          recvphone: phoneDigits,
          buildingName: aptName,
          privacyAgreed,
        }),
      });
      const order = await res.json();
      if (!order.ok) throw new Error(order.error);
      window.location.href = order.payurl;
    } catch (e: any) {
      setOrderError(e?.message || (lang === 'ko' ? '결제 오류가 발생했습니다.' : 'Payment error. Please try again.'));
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: '#FDFCFB', color: '#191c1d' }}>
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
              <div>{refundInfo.months}{lang === 'ko' ? '개월' : ' months'}</div>
              <div>× {refundInfo.monthly.toLocaleString('ko-KR')}{lang === 'ko' ? '원/월' : '₩/mo'}</div>
            </div>
          </div>
        )}

        {/* 영문 사용자: 한국어 서류 안내 배너 */}
        {lang === 'en' && (
          <div className="flex items-start gap-3 px-4 py-3 mb-4"
            style={{ background: '#f0f4ff', borderRadius: '12px', border: '1px solid #bec2ff' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>🇰🇷</span>
            <p style={{ fontSize: '12px', color: '#0001bb', lineHeight: 1.6 }}>
              <strong>Your document will be written in Korean.</strong><br />
              Korean law governs this contract — the landlord reads Korean. We generate the 내용증명 (certified letter) in Korean automatically. You fill in English; we handle the rest.
            </p>
          </div>
        )}

        {/* ── 서류 정보 입력 ── */}
        <div style={{ borderRadius: '16px', border: '1.5px solid #e1e3e4', marginBottom: '18px', overflow: 'hidden' }}>

          <button
            onClick={() => setDocOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4"
            style={{ background: isComplete ? '#f0fff4' : '#f8f9ff', border: 'none', cursor: 'pointer' }}
          >
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '20px' }}>✍️</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#191c1d' }}>{tc.docSectionTitle}</p>
                <p style={{ fontSize: '11px', color: isComplete ? '#00732c' : '#757589', marginTop: '1px' }}>
                  {isComplete ? tc.docSectionComplete : tc.docSectionSub(filled, fields.length)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: '40px', height: '4px', background: '#e1e3e4', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: isComplete ? '#00C853' : '#0001bb', borderRadius: '2px', transition: 'width 0.3s' }} />
              </div>
              {docOpen ? <ChevronUp size={16} style={{ color: '#757589' }} /> : <ChevronDown size={16} style={{ color: '#757589' }} />}
            </div>
          </button>

          {docOpen && (
            <div style={{ padding: '0 20px 20px', borderTop: '1px solid #e1e3e4' }}>

              {/* 나 / My Info */}
              <SectionHead label={tc.myInfoTitle} />
              <Field label={tc.myNameLabel} hint={tc.myNameHint} required>
                <Input value={myName} onChange={setMyName} placeholder={tc.myNamePh} />
              </Field>
              <Field label={tc.myAddrLabel} hint={tc.myAddrHint}>
                <Input value={myAddr} onChange={setMyAddr} placeholder={tc.myAddrPh} />
              </Field>
              <Field label={tc.myAccountLabel} hint={tc.myAccountHint}>
                <Input value={myAccount} onChange={setMyAccount} placeholder={tc.myAccountPh} />
              </Field>

              {/* 집주인 / Landlord */}
              <SectionHead label={tc.llInfoTitle} />
              <Field label={tc.llNameLabel} hint={tc.llNameHint}>
                <Input value={llName} onChange={setLlName} placeholder={tc.llNamePh} />
              </Field>
              <Field label={tc.llAddrLabel} hint={tc.llAddrHint} required warn={tc.llAddrWarn}>
                <Input value={llAddr} onChange={setLlAddr} placeholder={tc.llAddrPh} />
              </Field>

              {/* 부동산 / Property */}
              <SectionHead label={tc.aptInfoTitle} />
              <Field label={tc.aptNameLabel}>
                <Input value={aptName} onChange={setAptName} placeholder={tc.aptNamePh} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Field label={tc.startDateLabel}>
                  <Input value={contractStart} onChange={setContractStart} placeholder={tc.startDatePh} />
                </Field>
                <Field label={tc.endDateLabel}>
                  <Input value={contractEnd} onChange={setContractEnd} placeholder={tc.endDatePh} />
                </Field>
              </div>

              {/* 팁 */}
              <div style={{ background: '#f0f4ff', borderRadius: '10px', padding: '12px 14px', marginTop: '8px' }}>
                <p style={{ fontSize: '12px', color: '#0001bb', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                  {tc.docTip}
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
            { key: 'portone' as const, label: tc.tabPortone || '💛 카카오페이 / 포트원', icon: <CreditCard size={15} /> },
            { key: 'payapp' as const, label: tc.tabPayapp, icon: <Smartphone size={15} /> },
            ...(SHOW_TOSS_TAB ? [{ key: 'toss' as const, label: tc.tabKorean, icon: <CreditCard size={15} /> }] : []),
            { key: 'paypal' as const, label: tc.tabPaypal, icon: <Globe size={15} /> },
          ]).map(({ key, label, icon }) => (
            <button key={key} onClick={() => setMode(key)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 font-semibold transition-all"
              style={{ fontSize: '12px', borderRadius: '10px',
                background: mode === key ? '#fff' : 'transparent',
                color: mode === key ? '#0001bb' : '#757589',
                boxShadow: mode === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                border: 'none', cursor: 'pointer' }}>
              {icon}{label}
            </button>
          ))}
        </div>

        {/* 개인정보 수집 및 이용 동의 (한국 개인정보보호법 준수) */}
        <div className="mb-4 p-3.5" style={{ background: '#f8f9ff', borderRadius: '12px', border: '1px solid #e1e3e4' }}>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={privacyAgreed}
              onChange={(e) => setPrivacyAgreed(e.target.checked)}
              style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#0001bb', cursor: 'pointer' }}
            />
            <div style={{ fontSize: '12px', lineHeight: 1.5, color: '#454558' }}>
              <span style={{ fontWeight: 700, color: '#0001bb' }}>[필수/Required]</span>{' '}
              {lang === 'ko' ? (
                <>
                  개인정보 수집 및 이용에 동의합니다.{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}
                    style={{ color: '#0001bb', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, fontSize: '12px', cursor: 'pointer' }}
                  >
                    [전문 보기]
                  </button>
                </>
              ) : (
                <>
                  I agree to the Collection and Use of Personal Information for generating the legal document.{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}
                    style={{ color: '#0001bb', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, fontSize: '12px', cursor: 'pointer' }}
                  >
                    [View Terms]
                  </button>
                </>
              )}
            </div>
          </label>
        </div>

        {orderError && (
          <div className="px-4 py-3 mb-4" style={{ background: '#ffdad6', borderRadius: '12px' }}>
            <p style={{ fontSize: '13px', color: '#ba1a1a' }}>{orderError}</p>
          </div>
        )}

        {mode === 'portone' && (
          <div>
            <div className="px-4 py-3 mb-4" style={{ background: '#fffbe6', borderRadius: '12px', border: '1px solid #ffe58f' }}>
              <p style={{ fontSize: '13px', color: '#873800', fontWeight: 600 }}>
                {tc.portoneInfo || '카카오페이, 네이버페이, 신용카드, 계좌이체 등 간편하게 안전결제 됩니다.'}
              </p>
            </div>
            <button onClick={handlePortonePayment} disabled={isPaying}
              className="w-full flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#fee500,#fada00)', color: '#000000',
                borderRadius: '16px', fontSize: '16px', padding: '18px 24px',
                boxShadow: '0 8px 24px rgba(254,229,0,0.4)', border: 'none', cursor: isPaying ? 'not-allowed' : 'pointer' }}>
              <CreditCard size={18} />
              {isPaying ? tc.portoneBtnLoading : (tc.portoneBtn || '4,900원 결제하기')}
            </button>
            <p className="text-center mt-3" style={{ fontSize: '12px', color: '#757589' }}>
              {tc.portoneHint || '카카오페이 · 네이버페이 · 신용카드 · 휴대폰 소액결제 지원'}
            </p>
          </div>
        )}

        {mode === 'payapp' && (
          <div>
            <div className="px-4 py-3 mb-4" style={{ background: '#f0f0ff', borderRadius: '12px', border: '1px solid #bec2ff' }}>
              <p style={{ fontSize: '13px', color: '#0001bb' }}>{tc.payappInfo}</p>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#454558', marginBottom: '6px' }}>
                {tc.payappPhoneLabel}
                <span style={{ color: '#ba1a1a', marginLeft: '3px' }}>*</span>
              </label>
              <input
                value={recvPhone}
                onChange={e => setRecvPhone(e.target.value.replace(/[^\d-]/g, ''))}
                placeholder={tc.payappPhonePh}
                style={{
                  width: '100%', padding: '12px 14px', fontSize: '15px',
                  border: '1.5px solid #c5c4db', borderRadius: '10px',
                  outline: 'none', color: '#191c1d', background: '#fafafa', fontFamily: 'inherit',
                }}
              />
            </div>
            <button onClick={handlePayappPayment} disabled={isPaying}
              className="w-full flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#0001bb,#0000ee)', color: '#fff',
                borderRadius: '16px', fontSize: '16px', padding: '18px 24px',
                boxShadow: '0 8px 24px rgba(0,0,255,0.3)', border: 'none', cursor: isPaying ? 'not-allowed' : 'pointer' }}>
              <Smartphone size={18} />
              {isPaying ? tc.payappBtnLoading : tc.payappBtn}
            </button>
            <p className="text-center mt-3" style={{ fontSize: '12px', color: '#757589' }}>{tc.payappHint}</p>
          </div>
        )}

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
                  if (!privacyAgreed) {
                    setOrderError(lang === 'ko' ? '개인정보 수집 및 이용에 동의해 주세요.' : 'Please agree to the Collection and Use of Personal Information.');
                    throw new Error('Privacy consent required');
                  }
                  savePdfData();
                  const res = await fetch('/api/payment/paypal/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      productId: PRODUCT_ID,
                      userContact: recvPhone,
                      buildingName: aptName,
                      privacyAgreed,
                    }),
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

        {/* 개인정보 처리방침 전문 모달 */}
        {showPrivacyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl overflow-y-auto max-h-[80vh]">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {lang === 'ko' ? '개인정보 수집 및 이용 동의' : 'Privacy Collection & Usage Policy'}
              </h3>
              <div className="text-xs text-gray-600 space-y-2 leading-relaxed">
                <p><strong>1. 수집하는 개인정보 항목:</strong> 성명, 연락처(휴대폰 번호), 주소, 거주 부동산 정보(아파트/오피스텔명), 결제 기록</p>
                <p><strong>2. 개인정보의 수집 및 이용 목적:</strong> 장기수선충당금 반환 청구용 내용증명 PDF 문서 생성, 결제 확인 및 CS 응대, 법적 증거 자료 보존</p>
                <p><strong>3. 개인정보의 보유 및 이용 기간:</strong> 전자상거래 등에서의 소비자보호에 관한 법률 등 관련 법령에 따라 결제 및 이행 완료 후 5년간 보관 후 파기합니다.</p>
                <p><strong>4. 동의 거부 권리:</strong> 이용자는 개인정보 수집 동의를 거부할 권리가 있으나, 거부 시 내용증명 서류 생성 및 서비스 이용이 제한됩니다.</p>
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="mt-5 w-full py-2.5 bg-[#0001bb] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                {lang === 'ko' ? '동의하고 닫기' : 'Agree & Close'}
              </button>
            </div>
          </div>
        )}

        {/* 법적 사업자 정보 푸터 (전자상거래법 & PG 심사 필수 준수) */}
        <footer className="mt-12 pt-8 pb-10 border-t border-gray-200 text-center text-xs text-gray-500 space-y-2">
          <div className="font-bold text-gray-800">장충금헌터 (Jang-chung-geum Hunter)</div>
          <div>대표자: 이진영 | 사업자등록번호: 361-70-00626</div>
          <div>사업장 주소: 대구광역시 북구 고성로 172-1, 505호(고성동2가, 삼부빌)</div>
          <div>통신판매업신고: 전자상거래 소매업 | 이메일: info@bororefund.com</div>
          <div className="text-[11px] text-gray-400 mt-2">
            ※ 본 서비스는 전자적 서식 작성 자동화 소프트웨어이며, 법률 자문이나 법률 대리를 제공하지 않습니다.
          </div>
          <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-gray-600 mt-3">
            <button type="button" onClick={() => setShowPrivacyModal(true)} className="hover:underline">개인정보처리방침</button>
            <span>·</span>
            <button type="button" onClick={() => setShowPrivacyModal(true)} className="hover:underline">이용약관</button>
            <span>·</span>
            <button type="button" onClick={() => setShowPrivacyModal(true)} className="hover:underline">환불규정</button>
          </div>
        </footer>

        <div className="flex items-center justify-center gap-2 mt-5" style={{ color: '#c5c4db' }}>
          <ShieldCheck size={14} />
          <span style={{ fontSize: '12px' }}>{tc.security}</span>
        </div>
      </main>
    </div>
  );
}

