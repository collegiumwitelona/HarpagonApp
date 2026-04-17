import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useDarkMode } from '../context/DarkModeContext';
import { useLanguage } from '../context/LanguageContext';
import { isAdmin } from '../services/auth';
import { removeAuthToken } from '../utils/tokenHelper';

const Navbar = ({ children, onOpenMenu }) => {
  const { isDark, toggleDark } = useDarkMode();
  const { language, setLanguage, t, languageOptions } = useLanguage();
  const navigate = useNavigate();
  const adminLoggedIn = isAdmin();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  const selectedLanguage = useMemo(
    () => languageOptions.find((option) => option.code === language) || languageOptions[0],
    [language, languageOptions]
  );

  const handleAdminLogout = () => {
    removeAuthToken();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="flex items-center justify-between px-8 h-16 bg-white border-b border-slate-200 w-full shrink-0">
      <Logo />

      <div className="flex items-center gap-4 min-h-10">
        {children}

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            aria-label={t('common.language')}
            title={t('common.language')}
          >
            <span>{selectedLanguage?.flag}</span>
            <span>{selectedLanguage?.shortCode}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {isLanguageMenuOpen && (
            <div className="absolute right-0 top-full z-30 mt-2 min-w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              {languageOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => {
                    setLanguage(option.code);
                    setIsLanguageMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors ${
                    option.code === language
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{option.flag}</span>
                  <span>{option.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={toggleDark}
          aria-label={isDark ? t('navbar.disableDarkMode') : t('navbar.enableDarkMode')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-600 active:scale-90"
          title={isDark ? t('navbar.lightMode') : t('navbar.darkMode')}
        >
          {isDark ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3c0.5 0 1 .04 1.48.12A7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        {adminLoggedIn ? (
          <button
            onClick={handleAdminLogout}
            className="p-2 ml-2 hover:bg-rose-100 rounded-xl transition-all text-rose-600 active:scale-90"
            title={t('navbar.logout')}
            aria-label={t('navbar.logout')}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        ) : (
          onOpenMenu && (
            <button
              onClick={onOpenMenu}
              className="p-2 ml-2 hover:bg-slate-100 rounded-xl transition-all text-slate-600 active:scale-90"
              aria-label={t('navbar.openMenu')}
              title={t('common.menu')}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )
        )}
      </div>
    </nav>
  );
};

export default Navbar;