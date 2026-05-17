import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { getAuthToken, removeAuthToken } from '../utils/tokenHelper';
import { useForm } from '../utils/hooks';

const ChangePasswordButton = ({ variant = 'settings' }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePasswordChange = async (values) => {
    const normalizedPrevious = String(values.previousPassword || '').trim();
    const normalizedNew = String(values.newPassword || '').trim();
    const normalizedConfirm = String(values.confirmPassword || '').trim();

    if (!normalizedPrevious || !normalizedNew || !normalizedConfirm) {
      throw new Error(t('settings.changePasswordValidationError'));
    }

    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      throw new Error('No token');
    }

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
        throw new Error('Unauthorized');
      }

      if (response.status < 200 || response.status >= 300) {
        const apiMessage = String(response?.data?.message || '').trim();
        const apiErrors = Array.isArray(response?.data?.errors)
          ? response.data.errors.map((item) => String(item || '').trim()).filter(Boolean)
          : [];
        throw new Error(apiMessage || apiErrors.join(' ') || t('settings.changePasswordError'));
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Błąd zmiany hasła:', err);
      throw err;
    }
  };

  const form = useForm(
    { previousPassword: '', newPassword: '', confirmPassword: '' },
    handlePasswordChange
  );

  const openModal = () => {
    form.resetForm();
    setIsModalOpen(true);
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

            <form onSubmit={form.handleSubmit} className="space-y-5 text-left">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">{t('settings.previousPassword')}</label>
                <input
                  type="password"
                  name="previousPassword"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={form.values.previousPassword}
                  onChange={form.handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">{t('auth.newPassword')}</label>
                <input
                  type="password"
                  name="newPassword"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={form.values.newPassword}
                  onChange={form.handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">{t('auth.confirmPassword')}</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={form.values.confirmPassword}
                  onChange={form.handleChange}
                  required
                />
              </div>

              {form.error && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl py-3 px-4">
                  <p className="text-rose-500 text-sm text-center font-medium">{form.error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    form.resetForm();
                  }}
                  className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-2xl hover:bg-slate-200 transition-colors border border-slate-200"
                >
                  {t('settings.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={form.isSubmitting}
                  className="w-full bg-violet-700 text-white font-bold py-3 rounded-2xl hover:bg-violet-800 transition-colors shadow-lg shadow-violet-200 disabled:bg-slate-300"
                >
                  {form.isSubmitting ? t('auth.changingPassword') : t('auth.changePassword')}
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
