import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const PRODUCTS: Record<string, { name: string; amount: number }> = {
  content_cert: { name: '장충금 헌터 내용증명 PDF', amount: 4900 },
};

export async function POST(request: Request) {
  try {
    const { productId = 'content_cert', userContact, userEmail, buildingName, privacyAgreed } = await request.json();

    const product = PRODUCTS[productId] || PRODUCTS.content_cert;
    const orderId = `jcg_${randomBytes(8).toString('hex')}`;

    // Supabase 결제 기록 저장 (장애 내성)
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabase.from('payments').insert({
        order_id: orderId,
        amount: product.amount,
        status: 'pending',
        payment_method: 'portone',
        user_contact: userContact || null,
        user_email: userEmail || null,
        building_name: buildingName || null,
        privacy_agreed: privacyAgreed !== undefined ? Boolean(privacyAgreed) : true,
      });
    } catch (dbErr) {
      console.warn('[portone/create-order] Supabase insert warning:', dbErr);
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
