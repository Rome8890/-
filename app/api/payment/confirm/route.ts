import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { paymentKey, orderId, amount } = await request.json();

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ ok: false, error: 'TOSS_SECRET_KEY not configured' }, { status: 500 });
    }

    // 1. Toss 결제 최종 승인
    const encodedKey = Buffer.from(`${secretKey}:`).toString('base64');
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount: parseInt(amount) }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      console.error('Toss confirm error:', tossData);
      return NextResponse.json({ ok: false, error: tossData.message }, { status: 400 });
    }

    // 2. Supabase payments 테이블 저장
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.from('payments').insert({
      order_id: orderId,
      payment_key: paymentKey,
      amount: parseInt(amount),
      status: 'success',
      payment_method: tossData.method || '카드',
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Supabase insert warning:', error.message);
    }

    return NextResponse.json({ ok: true, paymentMethod: tossData.method });
  } catch (error: any) {
    console.error('Payment confirm error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
