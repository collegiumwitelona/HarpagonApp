import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const ConfirmEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [status, setStatus] = useState('verifying'); 

  useEffect(() => {
    const confirmEmail = async () => {
      const userId = searchParams.get('userId');
      let token = searchParams.get('token');

      
      if (!userId || !token) {
        console.error("Brak userId lub tokenu w adresie URL");
        setStatus('error');
        return;
      }

      
      token = token.replace(/ /g, '+');

      try {
        
        
        const response = await api.post('/Auth/confirm-email', null, {
          method: 'POST',
          params: {
            userId,
            token,
          },
          headers: {
            'Accept': '*/*'
          },
          validateStatus: () => true,
        });

        if (response.status >= 200 && response.status < 300) {
          setStatus('success');
          
          setTimeout(() => navigate('/login'), 3000);
        } else {
          const errorText =
            typeof response.data === 'string' ? response.data : JSON.stringify(response.data || {});
          console.error("Serwer odrzucił weryfikację:", errorText);
          setStatus('error');
        }
      } catch (err) {
        console.error("Błąd sieci/połączenia z API:", err);
        setStatus('error');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 text-center">
        <h2 className="text-2xl font-bold mb-6 text-slate-900">{t('auth.confirmTitle')}</h2>

        {status === 'verifying' && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-700 mb-4"></div>
            <p className="text-slate-600">{t('auth.confirmWaiting')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-green-600">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
            </svg>
            <p className="font-bold text-lg">{t('auth.confirmSuccess')}</p>
            <p className="text-slate-500 mt-2 text-sm">{t('common.redirecting')}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-red-600">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <p className="font-bold text-lg">{t('auth.confirmError')}</p>
            <p className="text-slate-500 mt-2 text-sm">{t('auth.confirmErrorHint')}</p>
            <div className="mt-8">
              <Link to="/register" className="text-violet-700 font-bold hover:underline">
                {t('auth.tryRegisterAgain')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmailPage;