import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Input from '../components/Input';
import Button from '../components/LogButton';
import AlertCard from '../components/AlertCard';
import AuthCard from '../components/AuthCard';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userId = searchParams.get('userId');
    const token = searchParams.get('token');

    if (userId && token) {
      navigate(
        `/reset-password?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`,
        { replace: true }
      );
    }
  }, [navigate, searchParams]);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/Auth/forgot-password', null, {
        params: {
          email: email,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        setSuccess(t('auth.forgotPasswordSuccess'));
        setEmail('');
      } else {
        const data = response.data || {};
        const msg = typeof data === 'string' ? data : (data.message || '');
        if (response.status === 404 || /nie.*znale|not found/i.test(msg)) {
          setError(t('auth.forgotPasswordNotFound'));
        } else {
          setError(t('auth.forgotPasswordError'));
        }
      }
    } catch (err) {
      console.error("Błąd krytyczny:", err);
      setError(t('auth.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Navbar />

      <main className="grow flex flex-col justify-center items-center px-6 bg-hero-blur w-full relative">
        <AuthCard title={<>{t('auth.forgotPasswordTitle').split(' ')[0]} <span className="text-violet-700">{t('auth.forgotPasswordTitle').split(' ').slice(1).join(' ')}</span></>}>
          <p className="text-center text-sm text-slate-600 mb-6">
            {t('auth.forgotPasswordDescription')}
          </p>

          <AlertCard 
            type="error" 
            message={error} 
            show={!!error}
            onClose={() => setError('')}
          />

          <AlertCard 
            type="success" 
            message={success} 
            show={!!success}
          />

          <form className="space-y-4" onSubmit={handleForgotPassword}>
            <Input 
              label={t('auth.email')}
              type="email" 
              placeholder={t('auth.emailPlaceholder')}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="pt-2">
              <Button type="submit" disabled={loading || !email.trim()}>
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t('auth.sending')}
                  </div>
                ) : t('auth.sendResetLink')}
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

export default ForgotPasswordPage;
