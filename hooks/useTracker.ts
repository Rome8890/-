import { useEffect } from 'react';
import { logEvent, TrackingEvent } from '../lib/supabase';
import posthog from 'posthog-js';

export const useTracker = () => {
  /**
   * 특정 이벤트를 기록합니다. (Supabase + PostHog)
   */
  const track = (event: TrackingEvent, metadata: any = {}) => {
    console.log('Tracking Event:', event, metadata);
    
    // 1. Supabase 저장 (실패하더라도 무시)
    try { 
      if (typeof window !== 'undefined') {
        logEvent(event, metadata); 
      }
    } catch (e) {
      console.warn('Supabase logging failed:', e);
    }
    
    // 2. PostHog 캡처 (백업용)
    try { 
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture(event, metadata); 
      }
    } catch (e) {}

    // 3. Google Analytics 4 캡처 (가장 확실함)
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event, {
          ...metadata,
          send_to: 'G-HBN1VLXHRD'
        });
      }
    } catch (e) {
      console.error('GA4 tracking failed:', e);
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
