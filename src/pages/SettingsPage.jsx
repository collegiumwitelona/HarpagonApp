import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SideMenu from '../components/SideMenu';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
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
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState('');
  const [actionError, setActionError] = useState('');
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [activeAccountId, setActiveAccountId] = useState(() => localStorage.getItem('activeAccountId') || '');
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('0');

  const loadAccounts = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setAccountsLoading(true);
    setAccountsError('');

    try {
      const response = await api.get('/Me/Accounts', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        validateStatus: () => true,
      });

      if (response.status === 401) {
        removeAuthToken();
        navigate('/login');
        return;
      }

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Accounts loading failed with status ${response.status}`);
      }

      const normalizedAccounts = Array.isArray(response.data)
        ? response.data.map((account) => ({
            id: String(account?.id || account?.accountId || ''),
            name: String(account?.name || account?.accountName || t('common.account')),
            balance: Number(account?.balance ?? account?.currentBalance ?? 0),
          })).filter((account) => account.id)
        : [];

      setAccounts(normalizedAccounts);

      if (normalizedAccounts.length === 0) {
        setActiveAccountId('');
        localStorage.removeItem('activeAccountId');
        return;
      }

      const storedId = localStorage.getItem('activeAccountId') || '';
      const selectedId = normalizedAccounts.some((account) => account.id === storedId)
        ? storedId
        : normalizedAccounts[0].id;

      setActiveAccountId(selectedId);
      localStorage.setItem('activeAccountId', selectedId);
    } catch (error) {
      console.error('Błąd ładowania kont użytkownika:', error);
      setAccountsError(t('settings.accountsLoadError'));
    } finally {
      setAccountsLoading(false);
    }
  }, [navigate, t]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleSwitchAccount = (nextAccountId) => {
    setActiveAccountId(nextAccountId);
    localStorage.setItem('activeAccountId', nextAccountId);
  };

  const handleAddAccount = async (event) => {
    event.preventDefault();

    const accountName = String(newAccountName || '').trim();
    const normalizedBalance = String(newAccountBalance || '0').trim().replace(',', '.');
    const initialBalance = Number(normalizedBalance);

    if (!accountName || Number.isNaN(initialBalance)) {
      setActionError(t('settings.addAccountValidationError'));
      return;
    }

    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setActionError('');
    setAccountActionLoading(true);

    try {
      const response = await api.post(
        '/Me/Accounts',
        {
          accountName,
          initialBalance,
          initialGoal: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          validateStatus: () => true,
        }
      );

      if (response.status === 401) {
        removeAuthToken();
        navigate('/login');
        return;
      }

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Account create failed with status ${response.status}`);
      }

      await loadAccounts();
      setIsAddAccountModalOpen(false);
      setNewAccountName('');
      setNewAccountBalance('0');
    } catch (error) {
      console.error('Błąd dodawania konta:', error);
      setActionError(t('settings.accountCreateError'));
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleDeleteAccount = async (account) => {
    if (!account?.id || account.id === activeAccountId) {
      return;
    }

    const confirmed = window.confirm(
      t('settings.deleteAccountConfirm', { accountName: account.name })
    );

    if (!confirmed) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setActionError('');
    setAccountActionLoading(true);

    try {
      const response = await api.delete(`/Me/Accounts/${account.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        validateStatus: () => true,
      });

      if (response.status === 401) {
        removeAuthToken();
        navigate('/login');
        return;
      }

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Account delete failed with status ${response.status}`);
      }

      await loadAccounts();
    } catch (error) {
      console.error('Błąd usuwania konta:', error);
      setActionError(t('settings.accountDeleteError'));
    } finally {
      setAccountActionLoading(false);
    }
  };

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
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      <Navbar onOpenMenu={() => setIsMenuOpen(true)} />
      
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="grow flex items-start lg:items-center justify-center p-4 lg:p-6 min-h-0 overflow-visible lg:overflow-hidden">
        <div className="w-full max-w-[44rem] bg-white rounded-[3rem] p-6 md:p-8 shadow-sm border border-slate-200 lg:h-full lg:max-h-195 flex flex-col min-h-0">
          <h1 className="text-3xl font-black mb-8 tracking-tight text-center md:text-left shrink-0">{t('settings.title')}</h1>

          <div className="space-y-7 overflow-y-auto pr-1 custom-scrollbar flex-1 min-h-0">
            <section className="flex items-start gap-5 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-violet-200 shrink-0">
                {avatarLetter}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t('settings.loggedInAs')}</p>
                <p className="text-xl font-bold text-slate-800 leading-none">{displayName}</p>
              </div>
            </section>

            <section className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col min-h-72">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black tracking-tight text-slate-900">{t('settings.accountsTitle')}</h2>
                {accountsLoading && <span className="text-xs font-semibold text-slate-500">{t('common.loading')}</span>}
              </div>

              {accountsError && (
                <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                  {accountsError}
                </div>
              )}

              {actionError && (
                <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                  {actionError}
                </div>
              )}

              {accounts.length === 0 && !accountsLoading ? (
                <p className="text-sm font-medium text-slate-500">{t('settings.noAccounts')}</p>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                  {accounts.map((account) => {
                    const isActive = account.id === activeAccountId;

                    return (
                      <div key={account.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate w-full text-sm font-bold text-slate-800 text-left">{account.name}</p>
                          <p className="text-xs font-medium text-slate-500 text-left">
                            {t('dashboard.accountBalance')}: {Number.isFinite(account.balance) ? account.balance.toFixed(2) : '0.00'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isActive ? (
                            <span className="rounded-xl bg-emerald-100 text-emerald-700 px-3 py-1.5 text-xs font-black uppercase tracking-wide">
                              {t('settings.active')}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSwitchAccount(account.id)}
                              className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 text-xs font-black uppercase tracking-wide transition-colors"
                            >
                              {t('settings.switch')}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(account)}
                            disabled={isActive || accountActionLoading}
                            className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title={isActive ? t('settings.cannotDeleteActive') : t('settings.deleteAccount')}
                            aria-label={t('settings.deleteAccount')}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                              <path d="M10 11v6"></path>
                              <path d="M14 11v6"></path>
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setActionError('');
                    setNewAccountName('');
                    setNewAccountBalance('0');
                    setIsAddAccountModalOpen(true);
                  }}
                  disabled={accountActionLoading}
                  className="rounded-2xl bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 text-sm font-black tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {t('settings.addAccount')}
                </button>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 justify-items-center">
              {}
              <button className="w-full max-w-56 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all group active:scale-95">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-violet-600 transition-colors">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span className="font-bold text-slate-700 text-sm">{t('auth.changePassword')}</span>
              </button>

              <div className="relative">
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="w-full max-w-56 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all group active:scale-95"
                >
                  <span className="text-base">{languageOptions.find((option) => option.code === language)?.flag}</span>
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

            <div className="pt-7 border-t border-slate-100 flex flex-col items-center">
              
              <button onClick={handleLogout} className="w-full max-w-56 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-all border border-red-100 group active:scale-95 mb-4 shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100">
            <h2 className="text-2xl font-bold mb-2 text-slate-900">{t('settings.addAccount')}</h2>
            <p className="text-slate-500 mb-6 text-sm">{t('settings.addAccountModalDescription')}</p>

            <form onSubmit={handleAddAccount} className="space-y-5 text-left">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">{t('setup.accountName')}</label>
                <input
                  type="text"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  placeholder={t('setup.accountNamePlaceholder')}
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">{t('setup.balance')}</label>
                <input
                  type="number"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  placeholder="0"
                  value={newAccountBalance}
                  onChange={(e) => setNewAccountBalance(e.target.value)}
                  required
                />
              </div>

              {actionError && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl py-3 px-4">
                  <p className="text-rose-500 text-sm text-center font-medium">{actionError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddAccountModalOpen(false);
                    setActionError('');
                  }}
                  className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-2xl hover:bg-slate-200 transition-colors border border-slate-200"
                >
                  {t('settings.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={accountActionLoading}
                  className="w-full bg-violet-700 text-white font-bold py-3 rounded-2xl hover:bg-violet-800 transition-colors shadow-lg shadow-violet-200 disabled:bg-slate-300"
                >
                  {accountActionLoading ? t('setup.processing') : t('common.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;