import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const PRODUCTS: Record<string, { name: string; amount: number }> = {
  content_cert: { name: '장충금 헌터 내용증명 PDF', amount: 4900 },
};

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();

    const product = PRODUCTS[productId];
    if (!product) {
      return NextResponse.json({ ok: false, error: '존재하지 않는 상품입니다.' }, { status: 400 });
    }

    const orderId = `jcg_${randomBytes(8).toString('hex')}`;

    // Supabase 저장 실패해도 결제는 계속 진행 (장애 내성)
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabase.from('payments').insert({
        order_id: orderId,
        amount: product.amount,
        status: 'pending',
        payment_method: null,
      });
    } catch (dbErr) {
      // Supabase 장애 시 로그만 남기고 결제 계속 진행
      console.warn('[create-order] Supabase unavailable, proceeding without DB record:', dbErr);
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
