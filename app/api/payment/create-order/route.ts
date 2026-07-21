import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// 서버 고정 상품 테이블 — 클라이언트가 금액을 위조할 수 없음
const PRODUCTS: Record<string, { name: string; amount: number }> = {
  content_cert: { name: '장충금 헌터 내용증명 PDF', amount: 4900 },
};

export async function POST(request: Request) {
  try {
    const { productId, customerName } = await request.json();

    const product = PRODUCTS[productId];
    if (!product) {
      return NextResponse.json({ ok: false, error: '존재하지 않는 상품입니다.' }, { status: 400 });
    }

    // 서버에서 orderId 발급 (클라이언트 위조 불가)
    const orderId = `jcg_${randomBytes(8).toString('hex')}`;

    // Supabase에 pending 주문 기록
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.from('payments').insert({
      order_id: orderId,
      amount: product.amount,
      status: 'pending',
      payment_method: null,
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ ok: false, error: 'DB 오류' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      orderId,
      amount: product.amount,
      orderName: product.name,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
