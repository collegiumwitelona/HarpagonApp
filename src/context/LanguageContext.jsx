import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { translations } from '../constants/translations';

const DEFAULT_LANGUAGE = 'pl';

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key) => key,
  languageOptions: [],
});

const getStoredLanguage = () => {
  try {
    const storedLanguage = localStorage.getItem('language');
    return storedLanguage === 'en' ? 'en' : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

const interpolate = (template, values = {}) =>
  String(template).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => String(values[key] ?? ''));

const getTranslationValue = (language, key) => {
  const source = translations[language] || translations[DEFAULT_LANGUAGE];
  return String(key)
    .split('.')
    .reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), source);
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getStoredLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    const resolvedLanguage = nextLanguage === 'en' ? 'en' : DEFAULT_LANGUAGE;
    setLanguageState(resolvedLanguage);
    try {
      localStorage.setItem('language', resolvedLanguage);
    } catch {
      // Ignore storage write errors (e.g. privacy mode).
    }
  }, []);

  const t = useCallback((key, values) => {
    const translated = getTranslationValue(language, key) ?? getTranslationValue(DEFAULT_LANGUAGE, key) ?? key;
    return typeof translated === 'string' ? interpolate(translated, values) : key;
  }, [language]);

  const languageOptions = useMemo(
    () => [
      { code: 'pl', shortCode: 'PL', name: t('common.polish'), flag: '🇵🇱' },
      { code: 'en', shortCode: 'EN', name: t('common.english'), flag: '🇬🇧' },
    ],
    [t]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, languageOptions }),
    [language, setLanguage, t, languageOptions]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext);