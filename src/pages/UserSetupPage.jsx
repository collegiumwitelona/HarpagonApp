import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AuthCard from '../components/AuthCard';
import AlertCard from '../components/AlertCard';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { isAdmin } from '../services/auth';
import { getAuthToken, removeAuthToken } from '../utils/tokenHelper';
import { useForm } from '../utils/hooks';
import { hasAnyAccount } from '../utils/accounts';
import { NON_NEGATIVE_INPUT_PROPS, parseNonNegativeNumber } from '../utils/nonNegativeNumber';
import { getResponseErrorMessage } from '../utils/feedbackMessages';

const UserSetupPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleCreateAccount = async (values) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error(t('setup.authError'));
    }

    const initialBalance = parseNonNegativeNumber(values.initialBalance);
    const initialGoal = parseNonNegativeNumber(values.initialGoal, { allowEmpty: true }) ?? 0;

    if (Number.isNaN(initialBalance) || Number.isNaN(initialGoal)) {
      throw new Error(t('setup.validationError'));
    }

    try {
      const response = await api.post('/Me/Accounts', {
        accountName: values.accountName,
        initialBalance,
        initialGoal,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        localStorage.setItem('hasAccount', 'true');
        navigate('/dashboard');
      } else {
        if (response.status === 401) {
          removeAuthToken();
          throw new Error(t('setup.authError'));
        } else {
          throw new Error(getResponseErrorMessage(t, response, 'setup.createError'));
        }
      }
    } catch (err) {
      console.error("Błąd krytyczny podczas tworzenia konta:", err);
      throw err;
    }
  };

  const form = useForm(
    { accountName: '', initialBalance: '', initialGoal: '' },
    handleCreateAccount
  );

  useEffect(() => {
    if (isAdmin()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const checkAndNavigate = async () => {
      const token = getAuthToken();
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const response = await api.get('/Me/Accounts', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          validateStatus: () => true,
        });

        if (response.status === 401) {
          removeAuthToken();
          navigate('/login', { replace: true });
          return;
        }

        if (response.status >= 200 && response.status < 300 && hasAnyAccount(response.data)) {
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Błąd weryfikacji konta:', err);
      }
    };

    checkAndNavigate();
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Navbar />

      <main className="grow flex flex-col justify-center items-center px-6 bg-hero-blur w-full relative">
        <AuthCard
          title={<>{t('setup.title')}</>}
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">{t('setup.accountName')}</label>
              <input
                type="text"
                name="accountName"
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                placeholder={t('setup.accountNamePlaceholder')}
                value={form.values.accountName}
                onChange={form.handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">{t('setup.balance')}</label>
              <input
                type="number"
                name="initialBalance"
                {...NON_NEGATIVE_INPUT_PROPS}
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                placeholder="0"
                value={form.values.initialBalance}
                onChange={form.handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">{t('setup.goal')}</label>
              <input
                type="number"
                name="initialGoal"
                {...NON_NEGATIVE_INPUT_PROPS}
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                placeholder="0"
                value={form.values.initialGoal}
                onChange={form.handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={form.isSubmitting}
              className="w-full bg-violet-700 text-white font-bold py-4 rounded-2xl hover:bg-violet-800 transition-colors shadow-lg shadow-violet-200 disabled:bg-slate-300 mt-4"
            >
              {form.isSubmitting ? t('setup.processing') : t('setup.submit')}
            </button>
          </form>
        </AuthCard>
      </main>

      <Footer />
    </div>
  );
};

export default UserSetupPage;