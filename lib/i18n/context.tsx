'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, Tx } from './translations';

interface LanguageCtx {
  lang: Language;
  setLang: (l: Language) => void;
  tx: Tx;
}

const LanguageContext = createContext<LanguageCtx>({
  lang: 'ko',
  setLang: () => {},
  tx: translations.ko,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('ko');

  useEffect(() => {
    const saved = localStorage.getItem('boro_lang') as Language;
    if (saved === 'ko' || saved === 'en') {
      setLangState(saved);
      return;
    }
    // Auto-detect: non-Korean browsers → English
    if (!navigator.language.toLowerCase().startsWith('ko')) {
      setLangState('en');
    }
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('boro_lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, tx: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
