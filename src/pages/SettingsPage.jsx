import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SideMenu from '../components/SideMenu';
import { useLanguage } from '../context/LanguageContext';
import { isAdmin, getUserName, getUserSurname } from '../services/auth';
import { getAuthToken, getStoredUserProfile, removeAuthToken } from '../utils/tokenHelper';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t, languageOptions } = useLanguage();

  useEffect(() => {
    if (isAdmin()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const { api } = await import('../services/api');
      await api.post('/Auth/logout', { refreshToken: refreshToken || '' }, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        validateStatus: () => true,
      });
    } catch (err) {
      console.error('Błąd podczas wylogowywania:', err);
    } finally {
      removeAuthToken();
      navigate('/login');
    }
  };
  const [isLangOpen, setIsLangOpen] = useState(false);

  const token = getAuthToken();
  const storedProfile = getStoredUserProfile();
  const userName = storedProfile?.name || getUserName(token);
  const userSurname = storedProfile?.surname || getUserSurname(token);

  const avatarLetter = String(userName || 'U').trim().charAt(0).toUpperCase() || 'U';
  const displayName = `${userName} ${userSurname}`.trim() || 'Użytkownik';

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Navbar onOpenMenu={() => setIsMenuOpen(true)} />
      
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="grow flex items-center justify-center p-4 lg:p-6 overflow-y-auto">
        <div className="w-full max-w-2xl bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-200">
          <h1 className="text-3xl font-black mb-10 tracking-tight text-center md:text-left">{t('settings.title')}</h1>

          <div className="space-y-10">
            <section className="flex items-start gap-5 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-violet-200 shrink-0">
                {avatarLetter}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t('settings.loggedInAs')}</p>
                <p className="text-xl font-bold text-slate-800 leading-none">{displayName}</p>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {}
              <button className="flex items-center justify-center gap-3 p-5 rounded-3xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all group active:scale-95">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-violet-600 transition-colors">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span className="font-bold text-slate-700 text-sm">{t('auth.changePassword')}</span>
              </button>

              <div className="relative">
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="w-full flex items-center justify-center gap-3 p-5 rounded-3xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all group active:scale-95"
                >
                  <span className="text-lg">{languageOptions.find((option) => option.code === language)?.flag}</span>
                  <span className="font-bold text-slate-700 text-sm">{t('settings.languageLabel')}: {language.toUpperCase()}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-300 transition-transform ${isLangOpen ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>

                {isLangOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {languageOptions.map((lang) => (
                      <button 
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); setIsLangOpen(false); }}
                        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
                      >
                        <span>{lang.flag}</span>
                        <span className="font-bold text-slate-600 text-sm">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-10 border-t border-slate-100 flex flex-col items-center">
              
              <button onClick={handleLogout} className="flex items-center justify-center gap-3 p-5 w-full md:w-72 rounded-3xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all border border-slate-200 group active:scale-95 mb-4 shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span className="font-bold text-sm">{t('navbar.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SettingsPage;