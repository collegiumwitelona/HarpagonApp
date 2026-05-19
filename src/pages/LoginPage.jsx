import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link, useNavigate } from "react-router-dom";
import Input from '../components/Input';
import Button from '../components/LogButton';
import AlertCard from '../components/AlertCard';
import AuthCard from '../components/AuthCard';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { isAdmin } from '../services/auth';
import { removeAuthToken, setRefreshToken, setStoredUserProfile } from '../utils/tokenHelper';
import { useForm } from '../utils/hooks';
import { hasAnyAccount } from '../utils/accounts';
import { getResponseErrorMessage } from '../utils/feedbackMessages';
import PageSeo from '../components/PageSeo';
import { getEmailFieldHint, getPasswordLoginHint } from '../utils/fieldHints';

const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const form = useForm(
    { email: '', password: '' },
    async (values) => {
      try {
        const response = await api.post('/Auth/login', {
          email: values.email,
          password: values.password,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: () => true,
        });

        if (response.status >= 200 && response.status < 300) {
          const rawData = response.data;
          let token = "";
          let refreshToken = "";

          if (typeof rawData === 'string') {
            token = rawData;
          } else if (rawData && typeof rawData === 'object') {
            token = rawData.accessToken || rawData.token || rawData.jwt || '';
            refreshToken = rawData.refreshToken || '';
          }

          if (!token && typeof rawData === 'string') {
            const jwtMatch = rawData.match(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
            token = jwtMatch ? jwtMatch[0] : '';
          }

          if (typeof token === 'string' && token.trim()) {
            token = token
              .trim()
              .replace(/^"|"$/g, '')
              .replace(/^Bearer\s+/i, '');
          } else {
            throw new Error(t('auth.loginFailed'));
          }

          localStorage.setItem('token', token);

          if (refreshToken) {
            setRefreshToken(refreshToken);
          }

          if (rawData && typeof rawData === 'object' && rawData.user) {
            setStoredUserProfile(rawData.user);
          }

          if (isAdmin(token)) {
            navigate('/admin', { replace: true });
            return;
          }

          console.log("Token zapisany pomyślnie.");

          try {
            const accountsResponse = await api.get('/Me/Accounts', {
              skipActionThrottle: true,
              validateStatus: () => true,
            });

            if (accountsResponse.status === 401) {
              removeAuthToken();
              navigate('/login', { replace: true });
              return;
            }

            if (accountsResponse.status >= 200 && accountsResponse.status < 300) {
              navigate(hasAnyAccount(accountsResponse.data) ? '/dashboard' : '/setup', { replace: true });
            } else {
              console.warn('Błąd podczas pobierania kont, status:', accountsResponse.status);
              navigate('/dashboard', { replace: true });
            }
          } catch (accountsErr) {
            if (accountsErr?.code === 'ACTION_THROTTLED') {
              return;
            }
            console.error('Błąd podczas weryfikacji kont:', accountsErr);
            navigate('/dashboard', { replace: true });
          }
        } else {
          const errorText =
            typeof response.data === 'string' ? response.data : JSON.stringify(response.data || {});
          console.error('Serwer odrzucił logowanie:', errorText);
          form.setError(
            getResponseErrorMessage(t, response, 'auth.invalidCredentials')
          );
        }
      } catch (err) {
        if (err?.code === 'ACTION_THROTTLED') {
          return;
        }
        console.error('Błąd krytyczny logowania:', err);
        form.setError(err?.message || t('common.networkError'));
      }
    }
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <PageSeo pageKey="login" />
      <Navbar />

      <main className="grow flex flex-col justify-center items-center px-6 bg-hero-blur w-full relative">
        <AuthCard
          title={<>{t('auth.loginTitle')} <span className="text-violet-700">Harpagon</span></>}
          scrollClassName="pr-1"
          compact
        >
          <AlertCard 
            type="error" 
            message={form.error} 
            show={!!form.error}
            onClose={() => form.setError('')}
          />

          <form className="space-y-3 px-1" onSubmit={form.handleSubmit}>
            <Input 
              label={t('auth.email')}
              type="email"
              name="email"
              placeholder={t('auth.emailPlaceholder')}
              title={getEmailFieldHint(t)}
              compact
              required
              value={form.values.email}
              onChange={form.handleChange}
            />

            <Input 
              label={t('auth.password')}
              type="password"
              name="password"
              placeholder={t('auth.passwordPlaceholder')}
              title={getPasswordLoginHint(t)}
              compact
              required
              value={form.values.password}
              onChange={form.handleChange}
            />

            <div className="pt-1">
              <Button type="submit" disabled={form.isSubmitting} className="py-3">
                {form.isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t('auth.authInProgress')}
                  </div>
                ) : t('common.login')}
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center text-sm text-slate-600 space-y-1.5">
            <p>
              {t('auth.forgotPassword')}{' '}
              <Link to="/forgot-password" className="text-violet-700 font-bold hover:underline">
                {t('auth.setAgain')}
              </Link>
            </p>
            <p>
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-violet-700 font-bold hover:underline">
                {t('common.register')}
              </Link>
            </p>
          </div>
        </AuthCard>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;