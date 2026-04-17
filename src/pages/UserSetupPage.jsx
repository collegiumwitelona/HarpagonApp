import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { isAdmin } from '../services/auth';

const UserSetupPage = () => {
  const [accountName, setAccountName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (isAdmin()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    
    const rawData = localStorage.getItem('token') || '';
    
    
    
    let cleanToken = rawData;

    
    if (cleanToken.includes('eyJ')) {
      const startIndex = cleanToken.indexOf('eyJ');
      
      const keywords = ['refreshToken', 'userid', 'email', 'name'];
      let endIndex = cleanToken.length;

      keywords.forEach(word => {
        const pos = cleanToken.indexOf(word);
        if (pos !== -1 && pos < endIndex && pos > startIndex) {
          endIndex = pos;
        }
      });

      cleanToken = cleanToken.substring(startIndex, endIndex);
    }

    
    cleanToken = cleanToken.replace(/[^a-zA-Z0-9.\-_]/g, '');

    console.log("Wysyłany czysty token:", cleanToken);

    setLoading(true);

    try {
      
      const response = await api.post('/Me/Accounts', {
          accountName: accountName,
          initialBalance: Number(initialBalance)
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanToken}`
          },
          validateStatus: () => true,
        }
      );

      if (response.status >= 200 && response.status < 300) {
        
        localStorage.setItem('hasAccount', 'true');
        navigate('/dashboard');
      } else {
        
        if (response.status === 401) {
          setError(t('setup.authError'));
        } else {
          const data = response.data || {};
          setError(data.message || t('setup.createError'));
        }
      }
    } catch (err) {
      console.error("Błąd krytyczny podczas tworzenia konta:", err);

      setError(t('auth.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 text-center">
        <h2 className="text-2xl font-bold mb-2 text-slate-900">{t('setup.title')}</h2>
        <p className="text-slate-500 mb-8 text-sm">{t('setup.description')}</p>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">{t('setup.accountName')}</label>
            <input
              type="text"
              className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
              placeholder={t('setup.accountNamePlaceholder')}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">{t('setup.balance')}</label>
            <input
              type="number"
              className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
              placeholder="0"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl py-3 px-4">
              <p className="text-rose-500 text-sm text-center font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-700 text-white font-bold py-4 rounded-2xl hover:bg-violet-800 transition-colors shadow-lg shadow-violet-200 disabled:bg-slate-300"
          >
            {loading ? t('setup.processing') : t('setup.submit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserSetupPage;