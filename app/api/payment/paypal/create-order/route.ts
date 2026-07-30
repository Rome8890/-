import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PRODUCTS: Record<string, { name: string; amountUSD: string }> = {
  content_cert: { name: 'Jangchoonggeum Legal Document PDF', amountUSD: '2.50' },
};

async function getPayPalToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_SECRET!;
  const base = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();

    const product = PRODUCTS[productId];
    if (!product) {
      return NextResponse.json({ ok: false, error: '존재하지 않는 상품입니다.' }, { status: 400 });
    }

    const base = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
    const token = await getPayPalToken();

    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: product.amountUSD },
          description: product.name,
        }],
      }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      return NextResponse.json({ ok: false, error: orderData.message }, { status: 400 });
    }

    // Supabase에 pending 기록
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabase.from('payments').insert({
      order_id: orderData.id,
      amount: Math.round(parseFloat(product.amountUSD) * 1000),
      status: 'pending',
      payment_method: 'paypal',
    });

    return NextResponse.json({ ok: true, paypalOrderId: orderData.id });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
