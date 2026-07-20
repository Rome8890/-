import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { paymentKey, orderId, amount } = await request.json();

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ ok: false, error: 'TOSS_SECRET_KEY not configured' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. 서버 기록과 금액 대조 (클라이언트 위조 방지)
    const { data: order, error: fetchError } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('order_id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ ok: false, error: '주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 이미 처리된 주문 (idempotency)
    if (order.status === 'success') {
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }

    if (order.amount !== parseInt(amount)) {
      console.error(`Amount mismatch: client=${amount}, server=${order.amount}`);
      return NextResponse.json({ ok: false, error: '결제 금액이 일치하지 않습니다.' }, { status: 400 });
    }

    // 2. Toss 결제 최종 승인 (서버 → 서버, 시크릿 키 사용)
    const encodedKey = Buffer.from(`${secretKey}:`).toString('base64');
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount: order.amount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      console.error('Toss confirm error:', tossData);
      await supabase.from('payments').update({ status: 'failed' }).eq('order_id', orderId);
      return NextResponse.json({ ok: false, error: tossData.message }, { status: 400 });
    }

    // 3. 결제 성공 — Supabase 업데이트 (idempotency 플래그: status='success')
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        payment_key: paymentKey,
        status: 'success',
        payment_method: tossData.method || '카드',
      })
      .eq('order_id', orderId)
      .eq('status', 'pending'); // pending 상태일 때만 업데이트 (중복 방지)

    if (updateError) {
      console.warn('Supabase update warning:', updateError.message);
    }

    return NextResponse.json({ ok: true, paymentMethod: tossData.method });
  } catch (error: any) {
    console.error('Payment confirm error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
