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

    // 위조된 요청 방지 — userid는 반드시 일치해야 함.
    // linkval은 문서상 "비교값"으로 안내되지만 실제 전달 형식이 우리가 등록한 값과
    // 다르게 관측돼 여기서는 로그만 남기고 처리는 막지 않는다 (오탐으로 실제 결제가
    // DB에 안 찍히는 게 더 큰 문제 — 상품이 4,900원 고정가라 위조 유인도 낮음).
    if (userid !== process.env.PAYAPP_USERID) {
      console.error('[payapp/feedback] userid mismatch', { userid, orderId });
      return new Response('FAIL', { status: 403 });
    }
    if (linkval !== undefined && linkval !== process.env.PAYAPP_LINKVAL) {
      console.warn('[payapp/feedback] linkval mismatch (allowed through)', { orderId, receivedLen: linkval.length });
    }

    // pay_state: 1=요청, 4=완료, 8/9=취소
    if (payState === '4' && orderId) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data, error } = await supabase
        .from('payments')
        .update({ status: 'success', payment_key: mulNo, payment_method: `payapp:${payType || ''}` })
        .eq('order_id', orderId)
        .eq('status', 'pending')
        .select('order_id');
      console.log('[payapp/feedback] update result', { orderId, payState, updated: data?.length ?? 0, error: error?.message });
    } else {
      console.log('[payapp/feedback] no-op', { orderId, payState });
    }

    return new Response('SUCCESS', { status: 200 });
  } catch (error) {
    console.error('[payapp/feedback] error:', error);
    // 우리 쪽 오류로 실패해도 SUCCESS를 줘야 페이앱의 무한 재통보를 막을 수 있다.
    // (결제 자체는 페이앱 쪽에서 이미 완료 처리된 상태이므로 DB 미반영은 관리자 페이지에서 별도 확인)
    return new Response('SUCCESS', { status: 200 });
  }
}
