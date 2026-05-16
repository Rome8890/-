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
  | 'payment_success'
  | 'download_pdf'
  | 'chat_inquiry';

/**
 * 행동 로그 저장 함수
 */
export const logEvent = async (event: TrackingEvent, metadata: any = {}) => {
  try {
    const { data, error } = await supabase
      .from('tracking_events')
      .insert([
        { 
          event_type: event, 
          metadata: metadata,
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
          path: typeof window !== 'undefined' ? window.location.pathname : '/'
        }
      ]);
    
    if (error) throw error;
  } catch (err) {
    console.error('Tracking Error:', err);
  }
};
