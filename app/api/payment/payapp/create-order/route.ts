import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const PRODUCTS: Record<string, { name: string; amount: number }> = {
  content_cert: { name: '장충금 헌터 내용증명 PDF', amount: 4900 },
};

export async function POST(request: Request) {
  try {
    const { productId, recvphone } = await request.json();

    const product = PRODUCTS[productId];
    if (!product) {
      return NextResponse.json({ ok: false, error: '존재하지 않는 상품입니다.' }, { status: 400 });
    }

    const phoneDigits = String(recvphone || '').replace(/\D/g, '');
    if (phoneDigits.length < 9 || phoneDigits.length > 11) {
      return NextResponse.json({ ok: false, error: '휴대폰 번호를 정확히 입력해 주세요.' }, { status: 400 });
    }

    const userid = process.env.PAYAPP_USERID;
    if (!userid) {
      return NextResponse.json({ ok: false, error: 'PAYAPP_USERID not configured' }, { status: 500 });
    }

    const orderId = `jcg_${randomBytes(8).toString('hex')}`;
    const origin = new URL(request.url).origin;

    // 페이앱 REST API는 JSON이 아니라 폼 인코딩 요청/쿼리스트링 응답을 사용한다
    const body = new URLSearchParams({
      cmd: 'payrequest',
      userid,
      goodname: product.name,
      price: String(product.amount),
      recvphone: phoneDigits,
      feedbackurl: `${origin}/api/payment/payapp/feedback`,
      returnurl: `${origin}/payment/success?paymentKey=payapp&orderId=${orderId}&amount=${product.amount}`,
      var1: orderId,
    });

    const payappRes = await fetch('https://api.payapp.kr/oapi/apiLoad.html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const resultText = await payappRes.text();
    const result = new URLSearchParams(resultText);

    if (result.get('state') !== '1') {
      console.error('PayApp payrequest error:', resultText);
      return NextResponse.json({ ok: false, error: result.get('errorMessage') || '결제 요청 생성에 실패했습니다.' }, { status: 400 });
    }

    const payurl = result.get('payurl');
    if (!payurl) {
      return NextResponse.json({ ok: false, error: '결제창 주소를 받지 못했습니다.' }, { status: 400 });
    }

    // Supabase 저장 실패해도 결제는 계속 진행 (장애 내성) — 다른 결제수단 라우트와 동일 패턴
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabase.from('payments').insert({
        order_id: orderId,
        amount: product.amount,
        status: 'pending',
        payment_method: 'payapp',
      });
    } catch (dbErr) {
      console.warn('[payapp/create-order] Supabase unavailable, proceeding without DB record:', dbErr);
    }

    return NextResponse.json({ ok: true, orderId, payurl });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
