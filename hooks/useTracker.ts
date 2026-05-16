import { useEffect } from 'react';
import { logEvent, TrackingEvent } from '../lib/supabase';
import posthog from 'posthog-js';

export const useTracker = () => {
  /**
   * 특정 이벤트를 기록합니다. (Supabase + PostHog)
   */
  const track = (event: TrackingEvent, metadata: any = {}) => {
    // 1. Supabase 저장 (실패하더라도 무시)
    try { logEvent(event, metadata); } catch (e) {}
    
    // 2. PostHog 캡처 (백업용)
    try { posthog.capture(event, metadata); } catch (e) {}

    // 3. Google Analytics 4 캡처
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, metadata);
    }
  };

  /**
   * 페이지 뷰를 기록합니다.
   */
  const trackPageView = (pageName: string) => {
    track('view_page', { page: pageName });
    posthog.capture('$pageview', { page: pageName });
  };

  return { track, trackPageView };
};
