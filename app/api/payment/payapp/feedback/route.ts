import { createClient } from '@supabase/supabase-js';

// 페이앱이 결제 상태가 바뀔 때마다(요청/완료/취소) 서버 대 서버로 호출하는 웹훅.
// 반드시 순수 텍스트 "SUCCESS" 로 응답해야 페이앱이 재통보를 멈춘다 (JSON 아님).
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const userid = form.get('userid')?.toString() ?? '';
    const linkval = form.get('linkval')?.toString();
    const orderId = form.get('var1')?.toString() ?? '';
    const payState = form.get('pay_state')?.toString();
    const mulNo = form.get('mul_no')?.toString() ?? '';
    const payType = form.get('pay_type')?.toString();

    // 위조된 요청 방지 — userid 일치 + (전달된 경우) 연동 VALUE 일치 확인
    const userIdOk = userid === process.env.PAYAPP_USERID;
    const linkvalOk = linkval === undefined || linkval === process.env.PAYAPP_LINKVAL;
    if (!userIdOk || !linkvalOk) {
      console.error('[payapp/feedback] verification failed', { userid, linkvalPresent: linkval !== undefined });
      return new Response('FAIL', { status: 403 });
    }

    // pay_state: 1=요청, 4=완료, 8/9=취소
    if (payState === '4' && orderId) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabase
        .from('payments')
        .update({ status: 'success', payment_key: mulNo, payment_method: `payapp:${payType || ''}` })
        .eq('order_id', orderId)
        .eq('status', 'pending');
    }

    return new Response('SUCCESS', { status: 200 });
  } catch (error) {
    console.error('[payapp/feedback] error:', error);
    // 우리 쪽 오류로 실패해도 SUCCESS를 줘야 페이앱의 무한 재통보를 막을 수 있다.
    // (결제 자체는 페이앱 쪽에서 이미 완료 처리된 상태이므로 DB 미반영은 관리자 페이지에서 별도 확인)
    return new Response('SUCCESS', { status: 200 });
  }
}
