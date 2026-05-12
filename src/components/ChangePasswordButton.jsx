import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { getAuthToken, removeAuthToken } from '../utils/tokenHelper';

const ChangePasswordButton = ({ variant = 'settings' }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previousPassword, setPreviousPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const openModal = () => {
    setError('');
    setPreviousPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedPrevious = String(previousPassword || '').trim();
    const normalizedNew = String(newPassword || '').trim();
    const normalizedConfirm = String(confirmPassword || '').trim();

    if (!normalizedPrevious || !normalizedNew || !normalizedConfirm) {
      setError(t('settings.changePasswordValidationError'));
      return;
    }

    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post(
        '/Auth/change-password',
        {
          previousPassword: normalizedPrevious,
          newPassword: normalizedNew,
          confirmPassword: normalizedConfirm,
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
        const apiMessage = String(response?.data?.message || '').trim();
        const apiErrors = Array.isArray(response?.data?.errors)
          ? response.data.errors.map((item) => String(item || '').trim()).filter(Boolean)
          : [];
        setError(apiMessage || apiErrors.join(' ') || t('settings.changePasswordError'));
        return;
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Błąd zmiany hasła:', err);
      setError(t('settings.changePasswordError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {variant === 'navbar' ? (
        <button
          type="button"
          onClick={openModal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all group active:scale-95 text-slate-600"
          title={t('auth.changePassword')}
          aria-label={t('auth.changePassword')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-violet-600 transition-colors shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span className="text-xs font-bold text-slate-700 group-hover:text-violet-700 transition-colors whitespace-nowrap">{t('auth.changePassword')}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={openModal}
          className="w-full max-w-56 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all group active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-violet-600 transition-colors">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span className="font-bold text-slate-700 text-sm">{t('auth.changePassword')}</span>
        </button>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100">
            <h2 className="text-2xl font-bold mb-2 text-slate-900">{t('auth.changePassword')}</h2>
            <p className="text-slate-500 mb-6 text-sm">{t('settings.changePasswordModalDescription')}</p>

            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">{t('settings.previousPassword')}</label>
                <input
                  type="password"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={previousPassword}
                  onChange={(e) => setPreviousPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">{t('auth.newPassword')}</label>
                <input
                  type="password"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">{t('auth.confirmPassword')}</label>
                <input
                  type="password"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl py-3 px-4">
                  <p className="text-rose-500 text-sm text-center font-medium">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setError('');
                  }}
                  className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-2xl hover:bg-slate-200 transition-colors border border-slate-200"
                >
                  {t('settings.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-violet-700 text-white font-bold py-3 rounded-2xl hover:bg-violet-800 transition-colors shadow-lg shadow-violet-200 disabled:bg-slate-300"
                >
                  {loading ? t('auth.changingPassword') : t('auth.changePassword')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChangePasswordButton;
