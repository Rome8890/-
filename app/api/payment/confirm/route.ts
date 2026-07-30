import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 서버 고정 상품 테이블 — Supabase 없이도 금액 검증 가능
const VALID_AMOUNT = 4900;

export async function POST(request: Request) {
  try {
    const { paymentKey, orderId, amount } = await request.json();

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ ok: false, error: 'TOSS_SECRET_KEY not configured' }, { status: 500 });
    }

    // 금액 검증 — DB 없이도 서버 고정 금액으로 1차 방어
    const clientAmount = parseInt(amount);
    if (clientAmount !== VALID_AMOUNT) {
      console.error(`Amount mismatch: client=${amount}, valid=${VALID_AMOUNT}`);
      return NextResponse.json({ ok: false, error: '결제 금액이 올바르지 않습니다.' }, { status: 400 });
    }

    // Supabase에서 주문 정보 조회 (가능하면)
    let dbAmount = VALID_AMOUNT;
    let alreadySuccess = false;
    let supabaseAvailable = false;

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: order, error } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('order_id', orderId)
        .single();

      if (!error && order) {
        supabaseAvailable = true;
        dbAmount = order.amount;
        alreadySuccess = order.status === 'success';

        if (alreadySuccess) {
          return NextResponse.json({ ok: true, alreadyProcessed: true });
        }
        if (dbAmount !== clientAmount) {
          console.error(`DB amount mismatch: client=${clientAmount}, db=${dbAmount}`);
          return NextResponse.json({ ok: false, error: '결제 금액이 일치하지 않습니다.' }, { status: 400 });
        }
      } else {
        console.warn('[confirm] Supabase unavailable or order not found, using fixed amount validation');
      }
    } catch (dbErr) {
      console.warn('[confirm] Supabase error, falling back to fixed amount:', dbErr);
    }

    // Toss 결제 최종 승인
    const encodedKey = Buffer.from(`${secretKey}:`).toString('base64');
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount: dbAmount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      console.error('Toss confirm error:', tossData);
      if (supabaseAvailable) {
        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          await supabase.from('payments').update({ status: 'failed' }).eq('order_id', orderId);
        } catch {}
      }
      return NextResponse.json({ ok: false, error: tossData.message }, { status: 400 });
    }

    // 결제 성공 — Supabase 업데이트 (실패해도 결제는 이미 완료됨)
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      if (supabaseAvailable) {
        await supabase
          .from('payments')
          .update({ payment_key: paymentKey, status: 'success', payment_method: tossData.method || '카드' })
          .eq('order_id', orderId)
          .eq('status', 'pending');
      } else {
        // Supabase가 없었으면 새로 insert 시도
        await supabase.from('payments').insert({
          order_id: orderId,
          amount: VALID_AMOUNT,
          status: 'success',
          payment_key: paymentKey,
          payment_method: tossData.method || '카드',
        });
      }
    } catch (dbErr) {
      // 결제는 성공했으므로 DB 오류는 경고만
      console.warn('[confirm] Supabase update failed after successful payment. orderId:', orderId, dbErr);
    }

    return NextResponse.json({ ok: true, paymentMethod: tossData.method });
  } catch (error: any) {
    console.error('Payment confirm error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
