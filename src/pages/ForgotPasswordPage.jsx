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
import { useForm } from '../utils/hooks';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [success, setSuccess] = useState('');

  const handleForgotPassword = async (values) => {
    try {
      const response = await api.post('/Auth/forgot-password', null, {
        params: {
          email: values.email,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        setSuccess(t('auth.forgotPasswordSuccess'));
      } else {
        const data = response.data || {};
        const msg = typeof data === 'string' ? data : (data.message || '');
        if (response.status === 404 || /nie.*znale|not found/i.test(msg)) {
          throw new Error(t('auth.forgotPasswordNotFound'));
        } else {
          throw new Error(t('auth.forgotPasswordError'));
        }
      }
    } catch (err) {
      console.error("Błąd krytyczny:", err);
      throw err;
    }
  };

  const form = useForm(
    { email: '' },
    handleForgotPassword
  );

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

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Navbar />

      <main className="grow flex flex-col justify-center items-center px-6 bg-hero-blur w-full relative">
        <AuthCard
          title={<>{t('auth.forgotPasswordTitle').split(' ')[0]} <span className="text-violet-700">{t('auth.forgotPasswordTitle').split(' ').slice(1).join(' ')}</span></>}
          scrollClassName="pr-2"
          compact
        >
          <p className="text-center text-sm text-slate-600 mb-6">
            {t('auth.forgotPasswordDescription')}
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
              label={t('auth.email')}
              type="email" 
              name="email"
              placeholder={t('auth.emailPlaceholder')}
              required
              value={form.values.email}
              onChange={form.handleChange}
            />

            <div className="pt-2">
              <Button type="submit" disabled={form.isSubmitting || !form.values.email.trim()}>
                {form.isSubmitting ? (
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
