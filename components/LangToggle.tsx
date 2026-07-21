'use client';

import { useLanguage } from '@/lib/i18n/context';
import { Language } from '@/lib/i18n/translations';

export function LangToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      style={{
        display: 'flex',
        background: 'rgba(0,0,0,0.07)',
        borderRadius: '20px',
        padding: '3px',
        gap: '2px',
      }}
    >
      {(['ko', 'en'] as Language[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: '3px 10px',
            borderRadius: '14px',
            fontSize: '12px',
            fontWeight: 700,
            background: lang === l ? '#0001bb' : 'transparent',
            color: lang === l ? '#fff' : '#757589',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s',
            letterSpacing: l === 'ko' ? '0' : '0.02em',
          }}
        >
          {l === 'ko' ? '한국어' : 'EN'}
        </button>
      ))}
    </div>
  );
}
