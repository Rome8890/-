'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { LanguageProvider } from '@/lib/i18n/context';

if (typeof window !== 'undefined') {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: 'always',
      capture_pageview: true,
    });
  }
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <LanguageProvider>{children}</LanguageProvider>
    </PostHogProvider>
  );
}
