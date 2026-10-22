import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Globe } from 'lucide-react';

export const LanguageToggle = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
      <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${
          lang === 'en'
            ? 'bg-white text-emerald-700 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang('am')}
        className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${
          lang === 'am'
            ? 'bg-white text-emerald-700 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        አማ
      </button>
    </div>
  );
};
