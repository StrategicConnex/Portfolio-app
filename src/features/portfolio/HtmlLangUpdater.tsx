'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

/**
 * Client component that syncs the selected language to the <html> lang attribute.
 * Must be rendered inside LanguageProvider.
 */
export function HtmlLangUpdater() {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
