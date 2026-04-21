import React from 'react';
import { Link } from "react-router-dom";
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="w-full h-16 min-h-16 shrink-0 border-t border-slate-200 bg-white">
      <Link to={'/about'} className="h-full max-w-6xl mx-auto px-6 text-center flex items-center justify-center">
        <p className="text-xs lg:text-sm text-slate-500 truncate">
          &copy; {currentYear} Harpagon. {t('footer.rights')} • {t('footer.studentProject')} • Collegium Witelona W Legnicy
        </p>
      </Link>
    </footer>
  );
};

export default Footer;