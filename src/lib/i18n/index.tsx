'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import {
  translations,
  type SupportedLanguage,
  type LanguageSetting,
  type TranslationKey,
} from './translations';

export { type SupportedLanguage, type LanguageSetting, type TranslationKey } from './translations';

interface I18nContextValue {
  lang: SupportedLanguage;
  setting: LanguageSetting;
  setLanguageSetting: (setting: LanguageSetting) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Detecta automaticamente o idioma do sistema ou navegador do usuário.
 * Retorna 'pt' para português, 'es' para espanhol e 'en' para inglês ou outros idiomas.
 */
export function detectSystemLanguage(): SupportedLanguage {
  if (typeof navigator === 'undefined') return 'pt';

  const langs = navigator.languages && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language || 'pt'];

  for (const rawLang of langs) {
    if (!rawLang) continue;
    const code = rawLang.toLowerCase();
    if (code.startsWith('pt')) return 'pt';
    if (code.startsWith('es')) return 'es';
    if (code.startsWith('en')) return 'en';
  }

  // Fallback universal para outros idiomas internacionais
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [languageSetting, setLanguageSetting] = useLocalStorage<LanguageSetting>(
    'flippy-lang-setting',
    'auto'
  );

  const [resolvedLanguage, setResolvedLanguage] = useState<SupportedLanguage>('pt');

  // Resolve o idioma ativo conforme a preferência (automático ou forçado)
  useEffect(() => {
    if (languageSetting === 'auto') {
      setResolvedLanguage(detectSystemLanguage());
    } else {
      setResolvedLanguage(languageSetting);
    }
  }, [languageSetting]);

  // Se estiver em modo automático, reage se o usuário alterar as preferências do sistema operacional/navegador
  useEffect(() => {
    if (languageSetting !== 'auto' || typeof window === 'undefined') return;

    const handleLanguageChange = () => {
      setResolvedLanguage(detectSystemLanguage());
    };

    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, [languageSetting]);

  // Atualiza atributo lang do elemento <html> para acessibilidade e SEO
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const htmlCode = resolvedLanguage === 'pt' ? 'pt-BR' : resolvedLanguage === 'es' ? 'es' : 'en';
      document.documentElement.lang = htmlCode;
    }
  }, [resolvedLanguage]);

  const value = useMemo<I18nContextValue>(() => {
    return {
      lang: resolvedLanguage,
      setting: languageSetting,
      setLanguageSetting,
      t: (key: TranslationKey, params?: Record<string, string | number>) => {
        const langDict = translations[resolvedLanguage] || translations.pt;
        let str: string = (langDict as any)[key] || (translations.pt as any)[key] || key;

        if (params) {
          for (const [k, v] of Object.entries(params)) {
            str = str.replace(`{${k}}`, String(v));
          }
        }
        return str;
      },
    };
  }, [resolvedLanguage, languageSetting, setLanguageSetting]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback seguro caso usado fora do provider
    return {
      lang: 'pt' as SupportedLanguage,
      setting: 'auto' as LanguageSetting,
      setLanguageSetting: () => {},
      t: (key: TranslationKey, params?: Record<string, string | number>) => {
        let str: string = (translations.pt as any)[key] || key;
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            str = str.replace(`{${k}}`, String(v));
          }
        }
        return str;
      },
    };
  }
  return ctx;
}
