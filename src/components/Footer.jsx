import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="w-full py-3 border-t border-slate-200 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <p className="text-sm text-slate-500 mb-2">
          &copy; {currentYear} Harpagon. {t('footer.rights')}
        </p>
        <p className="text-xs text-slate-400 uppercase tracking-widest">
          {t('footer.studentProject')} • Collegium Witelona W Legnicy
        </p>
      </div>
    </footer>
  );
};

export default Footer;