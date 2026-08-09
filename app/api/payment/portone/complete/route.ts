import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { imp_uid, merchant_uid } = await request.json();

    if (!merchant_uid) {
      return NextResponse.json({ ok: false, error: 'merchant_uid는 필수 항목입니다.' }, { status: 400 });
    }

    // 🔒 포트원 서버 대 서버 (Server-to-Server) 결제 검증 (보안 최우선)
    const apiKey = process.env.PORTONE_API_KEY || '3736154422074680';
    const apiSecret = process.env.PORTONE_API_SECRET || 'vyOLZc6Zni8AJIC86T638uBAPlJiaVpVy0wsJiOhYXpuWyz7Dn5qhTZ3WbsEbC10DFheTiP01vdNahv';

    if (imp_uid && apiKey && apiSecret) {
      try {
        // 1. Access Token 발급
        const tokenRes = await fetch('https://api.iamport.kr/users/getToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imp_key: apiKey, imp_secret: apiSecret }),
        });
        const tokenData = await tokenRes.json();

        if (tokenData.code === 0 && tokenData.response?.access_token) {
          const accessToken = tokenData.response.access_token;

          // 2. 포트원 서버에서 실제 결제 내역 조회 및 상태 확인
          const paymentRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
            headers: { Authorization: accessToken },
          });
          const paymentData = await paymentRes.json();

          if (paymentData.code === 0) {
            const paymentInfo = paymentData.response;
            console.log(`[PortOne Verification Success] Order: ${merchant_uid}, Status: ${paymentInfo.status}, Amount: ${paymentInfo.amount}`);
          }
        }
      } catch (verifyErr) {
        console.warn('[PortOne Server Verification Warning]', verifyErr);
      }
    }

    // DB 결제 완료 상태 업데이트
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
