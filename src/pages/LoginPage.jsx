import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link, useNavigate } from "react-router-dom";
import Input from '../components/Input';
import Button from '../components/LogButton';
import AlertCard from '../components/AlertCard';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { isAdmin } from '../services/auth';
import { setRefreshToken, setStoredUserProfile } from '../utils/tokenHelper';

const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      
      const response = await api.post('/Auth/login', {
          email: email,
          password: password,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          validateStatus: () => true,
        }
      );

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
          throw new Error('Invalid token format received from server.');
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
            validateStatus: () => true,
          });

          if (accountsResponse.status >= 200 && accountsResponse.status < 300) {
            const accounts = accountsResponse.data;

            
            
            if (Array.isArray(accounts) && accounts.length > 0) {
              const account = accounts[0];
              const hasBalanceConfigured =
                account && account.balance !== null && account.balance !== undefined;

              navigate(hasBalanceConfigured ? "/dashboard" : "/setup", { replace: true });
            } else {
              navigate("/setup", { replace: true });
            }
          } else {
            
            console.warn("Błąd podczas pobierania kont, status:", accountsResponse.status);
            navigate("/setup", { replace: true });
          }
        } catch (accountsErr) {
          console.error("Błąd podczas weryfikacji kont:", accountsErr);
          navigate("/setup", { replace: true });
        }

      } else {
        const errorText =
          typeof response.data === 'string' ? response.data : JSON.stringify(response.data || {});
        console.error("Serwer odrzucił logowanie:", errorText);
        setError(t('auth.invalidCredentials'));
      }
    } catch (err) {
      console.error("Błąd krytyczny logowania:", err);
      setError(t('auth.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Navbar />

      <main className="grow flex flex-col justify-center items-center px-6 bg-hero-blur w-full relative">
        <div className="relative z-10 max-w-sm w-full bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-100">
          
          <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">
            {t('auth.loginTitle')} <span className="text-violet-700">Harpagon</span>
          </h2>

          <AlertCard 
            type="error" 
            message={error} 
            show={!!error}
            onClose={() => setError('')}
          />

          <form className="space-y-4" onSubmit={handleLogin}>
            <Input 
              label={t('auth.email')}
              type="email" 
              placeholder={t('auth.emailPlaceholder')}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input 
              label={t('auth.password')}
              type="password" 
              placeholder={t('auth.passwordPlaceholder')}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t('auth.authInProgress')}
                  </div>
                ) : t('common.login')}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-slate-600 space-y-3">
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;