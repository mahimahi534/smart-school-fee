import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../locales/en.js';
import { am } from '../locales/am.js';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('smart_school_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('smart_school_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const translations = lang === 'am' ? am : en;

  const t = (key) => {
    return translations[key] || en[key] || key;
  };

  const formatETB = (amount) => {
    const num = Number(amount || 0);
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);

    if (lang === 'am') {
      return `${formatted} ብር`;
    }
    return `ETB ${formatted}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    try {
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return String(dateValue);
      return d.toLocaleDateString(lang === 'am' ? 'am-ET' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return String(dateValue);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, formatETB, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
