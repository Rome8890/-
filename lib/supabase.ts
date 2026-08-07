import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 행동 패턴 추적을 위한 이벤트 타입
 */
export type TrackingEvent = 
  | 'view_page'
  | 'click_calculate'
  | 'click_payment'
  | 'click_share_free'
  | 'payment_success'
  | 'download_pdf'
  | 'click_download'
  | 'click_home'
  | 'chat_inquiry';

/**
 * 행동 로그 저장 함수
 * 클라이언트는 자신의 IP를 알 수 없으므로 /api/track 서버 라우트를 거쳐서 기록한다.
 * (서버에서 x-forwarded-for / Vercel 지오 헤더를 읽어 metadata에 ip·country·city를 채워 넣음)
 */
export const logEvent = async (event: TrackingEvent, metadata: any = {}) => {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        metadata,
        path: typeof window !== 'undefined' ? window.location.pathname : '/',
      }),
    });
  } catch (err) {
    console.error('Tracking Error:', err);
  }
};
