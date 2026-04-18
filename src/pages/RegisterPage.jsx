import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Input from '../components/Input';
import Button from '../components/LogButton';
import AlertCard from '../components/AlertCard';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

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
  
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    surname: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  
  const handleFieldChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsMismatch'));
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/Auth/register', {
          email: formData.email,
          name: formData.name,
          surname: formData.surname,
          password: formData.password
        }, {
          headers: { 'Content-Type': 'application/json' },
          validateStatus: () => true,
        }
      );

      if (response.status >= 200 && response.status < 300) {
        
        alert(t('auth.joinSuccess'));
        navigate("/login");
      } else {
        const data = response.data;
        setError(getRegisterErrorMessage(data, t('auth.registerError')));
      }
    } catch (err) {
      console.error(err);
      setError(t('auth.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Navbar />
      <main className="grow flex flex-col justify-center items-center px-6 bg-hero-blur w-full relative">
        <div className="relative z-10 max-w-sm w-full h-112 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
          
          <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">
            {t('auth.registerTitle')} <span className="text-violet-700">Harpagon</span>
          </h2>

          <div className="grow min-h-0 overflow-y-auto pr-1 custom-scrollbar">
            <AlertCard 
              type="error" 
              message={error} 
              show={!!error}
              onClose={() => setError('')}
            />

            <form className="space-y-3" onSubmit={handleRegister}>
            <div className="flex gap-2">
              <Input 
                label={t('auth.name')}
                name="name"
                placeholder={t('auth.name')}
                required
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
              <Input 
                label={t('auth.surname')}
                name="surname"
                placeholder={t('auth.surname')}
                required
                value={formData.surname}
                onChange={(e) => handleFieldChange('surname', e.target.value)}
              />
            </div>

            <Input 
              label={t('auth.email')}
              type="email" 
              placeholder={t('auth.emailPlaceholder')}
              required
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
            />

            <Input 
              label={t('auth.password')}
              type="password" 
              placeholder={t('auth.createPassword')}
              required
              value={formData.password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
            />

            <Input 
              label={t('auth.confirmPassword')}
              type="password" 
              placeholder={t('auth.confirmPassword')}
              required
              value={formData.confirmPassword}
              onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
            />

              <div className="pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? t('auth.creatingAccount') : t('common.register')}
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center text-sm text-slate-600">
              <p>
                {t('auth.haveAccount')}{' '}
                <Link to="/login" className="text-violet-700 font-bold hover:underline">
                  {t('common.login')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RegisterPage;