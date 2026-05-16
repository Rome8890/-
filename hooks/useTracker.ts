import { useEffect } from 'react';
import { logEvent, TrackingEvent } from '../lib/supabase';

export const useTracker = () => {
  /**
   * 특정 이벤트를 기록합니다.
   */
  const track = (event: TrackingEvent, metadata: any = {}) => {
    logEvent(event, metadata);
  };

  /**
   * 페이지 뷰를 기록합니다. (컴포넌트 마운트 시 활용)
   */
  const trackPageView = (pageName: string) => {
    track('view_page', { page: pageName });
  };

  return { track, trackPageView };
};
