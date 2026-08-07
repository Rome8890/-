import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { imp_uid, merchant_uid } = await request.json();

    if (!merchant_uid) {
      return NextResponse.json({ ok: false, error: 'merchant_uid는 필수 항목입니다.' }, { status: 400 });
    }

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabase
        .from('payments')
        .update({
          status: 'completed',
          payment_key: imp_uid || null,
        })
        .eq('order_id', merchant_uid);
    } catch (dbErr) {
      console.warn('[portone/complete] Supabase update warning:', dbErr);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
