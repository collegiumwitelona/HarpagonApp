import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Input from '../components/Input';
import Button from '../components/LogButton';
import AlertCard from '../components/AlertCard';
import AuthCard from '../components/AuthCard';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { useForm } from '../utils/hooks';
import { getResponseErrorMessage } from '../utils/feedbackMessages';
import PageSeo from '../components/PageSeo';
import { getEmailFieldHint, getPasswordRegisterHint } from '../utils/fieldHints';
import { USER_NAME_MAX_LENGTH, PASSWORD_RULES } from '../constants/validationRules';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [success, setSuccess] = useState('');

  const handleRegister = async (values) => {
    setSuccess('');

    if (values.password !== values.confirmPassword) {
      throw new Error(t('auth.passwordsMismatch'));
    }

    const response = await api.post(
      '/Auth/register',
      {
        email: values.email,
        name: values.name,
        surname: values.surname,
        password: values.password,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      }
    );

    if (response.status >= 200 && response.status < 300) {
      setSuccess(t('auth.joinSuccess'));
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    throw new Error(getResponseErrorMessage(t, response, 'auth.registerError'));
  };

  const form = useForm(
    {
      email: '',
      name: '',
      surname: '',
      password: '',
      confirmPassword: '',
    },
    handleRegister
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <PageSeo pageKey="register" />
      <Navbar />
      <main className="grow flex flex-col justify-center items-center px-6 bg-hero-blur w-full relative">
        <AuthCard
          title={<>{t('auth.registerTitle')} <span className="text-violet-700">Harpagon</span></>}
          scrollClassName="pr-1"
          compact
        >
          <AlertCard
            type="error"
            message={form.error}
            show={!!form.error}
            onClose={() => form.setError('')}
          />

          <AlertCard type="success" message={success} show={!!success} />

          <form className="space-y-2.5 px-1" onSubmit={form.handleSubmit}>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label={t('auth.name')}
                name="name"
                placeholder={t('auth.name')}
                title={t('hints.nameMax', { max: USER_NAME_MAX_LENGTH })}
                maxLength={USER_NAME_MAX_LENGTH}
                compact
                required
                value={form.values.name}
                onChange={form.handleChange}
              />
              <Input
                label={t('auth.surname')}
                name="surname"
                placeholder={t('auth.surname')}
                title={t('hints.surnameMax', { max: USER_NAME_MAX_LENGTH })}
                maxLength={USER_NAME_MAX_LENGTH}
                compact
                required
                value={form.values.surname}
                onChange={form.handleChange}
              />
            </div>

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
              placeholder={t('auth.createPassword')}
              title={getPasswordRegisterHint(t)}
              maxLength={PASSWORD_RULES.maxLength}
              compact
              required
              value={form.values.password}
              onChange={form.handleChange}
            />

            <Input
              label={t('auth.confirmPassword')}
              type="password"
              name="confirmPassword"
              placeholder={t('auth.confirmPassword')}
              title={getPasswordRegisterHint(t)}
              maxLength={PASSWORD_RULES.maxLength}
              compact
              required
              value={form.values.confirmPassword}
              onChange={form.handleChange}
            />

            <div className="pt-2">
              <Button type="submit" disabled={form.isSubmitting || !!success} className="py-3">
                {form.isSubmitting ? t('auth.creatingAccount') : t('common.register')}
              </Button>
            </div>
          </form>

          <div className="mt-5 text-center text-sm text-slate-600">
            <p>
              {t('auth.haveAccount')}{' '}
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

export default RegisterPage;