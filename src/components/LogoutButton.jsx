import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { removeAuthToken } from '../utils/tokenHelper';

const LogoutButton = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      await api.post('/Auth/logout', { refreshToken: refreshToken || "" }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        validateStatus: () => true,
      });
    } catch (err) {
      console.error("Błąd podczas wylogowywania na serwerze:", err);
    } finally {
      removeAuthToken();
      navigate('/login');
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-500 font-bold hover:bg-red-50 transition-colors text-sm"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
      {t('navbar.logout')}
    </button>
  );
};

export default LogoutButton;