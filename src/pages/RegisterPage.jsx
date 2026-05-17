import React from 'react';
import { Link, useNavigate } from "react-router-dom";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Input from '../components/Input';
import Button from '../components/LogButton';
import AlertCard from '../components/AlertCard';
import AuthCard from '../components/AuthCard';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { useForm } from '../utils/hooks';

const getRegisterErrorMessage = (data, fallbackMessage) => {
  const errors = data?.errors;

  if (!errors) {
    return fallbackMessage;
  }

  if (typeof errors === 'string') {
    return errors;
  }

  if (Array.isArray(errors)) {
    return errors.filter(Boolean).join(' ') || fallbackMessage;
  }

  if (typeof errors === 'object') {
    const messages = Object.values(errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value) => typeof value === 'string' && value.trim().length > 0);

    return messages.join(' ') || fallbackMessage;
  }

  return fallbackMessage;
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleRegister = async (values) => {
    if (values.password !== values.confirmPassword) {
      throw new Error(t('auth.passwordsMismatch'));
    }

    try {
      const response = await api.post('/Auth/register', {
        email: values.email,
        name: values.name,
        surname: values.surname,
        password: values.password
      }, {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        alert(t('auth.joinSuccess'));
        navigate("/login");
      } else {
        const data = response.data;
        throw new Error(getRegisterErrorMessage(data, t('auth.registerError')));
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const form = useForm(
    {
      email: '',
      name: '',
      surname: '',
      password: '',
      confirmPassword: ''
    },
    handleRegister
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
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

          <form className="space-y-2.5 px-1" onSubmit={form.handleSubmit}>
          <div className="grid grid-cols-2 gap-2">
            <Input 
              label={t('auth.name')}
              name="name"
              placeholder={t('auth.name')}
              compact
              required
              value={form.values.name}
              onChange={form.handleChange}
            />
            <Input 
              label={t('auth.surname')}
              name="surname"
              placeholder={t('auth.surname')}
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
            compact
            required
            value={form.values.confirmPassword}
            onChange={form.handleChange}
          />

            <div className="pt-2">
              <Button type="submit" disabled={form.isSubmitting} className="py-3">
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