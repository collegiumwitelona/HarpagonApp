import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Input from '../components/Input';
import Button from '../components/LogButton';
import AlertCard from '../components/AlertCard';
import AuthCard from '../components/AuthCard';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { useForm } from '../utils/hooks';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  const [userId, setUserId] = useState('');
  const [token, setToken] = useState('');
  const [success, setSuccess] = useState('');

  const toFriendlyResetError = (rawError) => {
    const errorMap = {
      PasswordRequiresDigit: t('auth.passwordRequiresDigit'),
      PasswordRequiresUpper: t('auth.passwordRequiresUpper'),
      PasswordRequiresLower: t('auth.passwordRequiresLower'),
      PasswordRequiresNonAlphanumeric: t('auth.passwordRequiresSpecial'),
      PasswordTooShort: t('auth.passwordTooShort'),
      ResetPassword_InvalidToken: t('auth.resetInvalidLink'),
      User_NotFound: t('auth.resetInvalidUser'),
    };

    const sourceErrors =
      rawError && typeof rawError === 'object' && Array.isArray(rawError.errors)
        ? rawError.errors
        : [];

    const friendly = sourceErrors
      .map((err) => {
        const normalized = String(err || '').trim();
        return errorMap[normalized] || (normalized.startsWith('Password') ? normalized : '');
      })
      .filter(Boolean);

    if (friendly.length > 0) {
      return Array.from(new Set(friendly)).join(' ');
    }

    return t('auth.resetFallbackError');
  };

  const handleResetPassword = async (values) => {
    if (!userId || !token) {
      throw new Error(t('auth.resetMissingToken'));
    }

    if (!values.password.trim()) {
      throw new Error(t('auth.resetEmptyPassword'));
    }

    try {
      const response = await api.post('/Auth/reset-password', {
        userId,
        token,
        password: values.password,
      }, {
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        setSuccess(t('auth.resetSuccess'));
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2500);
      } else {
        throw new Error(toFriendlyResetError(response.data));
      }
    } catch (err) {
      console.error('Blad resetowania hasla:', err);
      throw err;
    }
  };

  const form = useForm(
    { password: '' },
    handleResetPassword
  );

  useEffect(() => {
    const linkUserId = searchParams.get('userId') || '';
    const linkToken = (searchParams.get('token') || '').replace(/ /g, '+');

    setUserId(linkUserId);
    setToken(linkToken);

    if (!linkUserId || !linkToken) {
      form.setError(t('auth.resetMissingLink'));
    }
  }, [searchParams, t, form]);

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Navbar />

      <main className="grow flex flex-col justify-center items-center px-6 bg-hero-blur w-full relative">
        <AuthCard
          title={<>{t('auth.resetPasswordTitle').split(' ').slice(0, 2).join(' ')} <span className="text-violet-700">{t('auth.resetPasswordTitle').split(' ').slice(2).join(' ')}</span></>}
          scrollClassName="pr-2"
        >
          <p className="text-center text-sm text-slate-600 mb-6">
            {t('auth.resetPasswordDescription')}
          </p>

          <AlertCard 
            type="error" 
            message={form.error} 
            show={!!form.error}
            onClose={() => form.setError('')}
          />

          <AlertCard 
            type="success" 
            message={success} 
            show={!!success}
          />

          <form className="space-y-4 px-1" onSubmit={form.handleSubmit}>
            <Input
              label={t('auth.newPassword')}
              type="password"
              name="password"
              placeholder={t('auth.newPasswordPlaceholder')}
              required
              value={form.values.password}
              onChange={form.handleChange}
            />

            <div className="pt-2">
              <Button type="submit" disabled={form.isSubmitting || !form.values.password.trim() || !userId || !token}>
                {form.isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t('auth.changingPassword')}
                  </div>
                ) : (
                  t('auth.changePassword')
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-slate-600 space-y-3">
            <p>
              {t('auth.rememberPassword')}{' '}
              <Link to="/login" className="text-violet-700 font-bold hover:underline">
                {t('common.login')}
              </Link>
            </p>
          </div>
        </AuthCard>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPasswordPage;