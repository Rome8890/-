import { logEvent, TrackingEvent } from '../lib/supabase';
import posthog from 'posthog-js';

const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'server';
  let sid = sessionStorage.getItem('jcg_sid');
  if (!sid) {
    sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    sessionStorage.setItem('jcg_sid', sid);
  }
  return sid;
};

const isDevMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('jcg_dev') === '1';
};

export const useTracker = () => {
  const track = (event: TrackingEvent, metadata: any = {}) => {
    const enriched = {
      ...metadata,
      session_id: getSessionId(),
      is_dev: isDevMode(),
      screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    };

    try {
      if (typeof window !== 'undefined') logEvent(event, enriched);
    } catch (e) {
      console.warn('Supabase logging failed:', e);
    }

    try {
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture(event, enriched);
      }
    } catch (e) {}

    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event, { ...enriched, send_to: 'G-HBN1VLXHRD' });
      }
    } catch (e) {}
  };

  const trackPageView = (pageName: string) => {
    track('view_page', { page: pageName });
    posthog.capture('$pageview', { page: pageName });
  };

  return { track, trackPageView };
};
