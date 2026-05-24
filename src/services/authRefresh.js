import axios from 'axios';
import {
  getRefreshToken,
  removeAuthToken,
  setAuthToken,
  setStoredUserProfile,
} from '../utils/tokenHelper';

const getApiBaseUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:8080';

const AUTH_PATHS_WITHOUT_REFRESH = [
  '/Auth/login',
  '/Auth/register',
  '/Auth/refresh',
  '/Auth/forgot-password',
  '/Auth/reset-password',
  '/Auth/confirm-email',
];

export const shouldSkipTokenRefresh = (config) => {
  if (!config) {
    return true;
  }

  if (config.skipTokenRefresh) {
    return true;
  }

  const url = String(config.url || '');
  return AUTH_PATHS_WITHOUT_REFRESH.some((path) => url.includes(path));
};

export const redirectToLogin = () => {
  removeAuthToken();

  if (typeof window === 'undefined') {
    return;
  }

  const { pathname } = window.location;
  if (pathname === '/login' || pathname === '/register') {
    return;
  }

  window.location.replace('/login');
};

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('NO_REFRESH_TOKEN');
  }

  const language = localStorage.getItem('language') === 'en' ? 'en-US' : 'pl-PL';

  const response = await axios.post(
    `${getApiBaseUrl()}/Auth/refresh`,
    { refreshToken },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Accept-Language': language,
      },
      validateStatus: () => true,
    }
  );

  if (response.status >= 200 && response.status < 300) {
    const data = response.data || {};
    const accessToken =
      data.accessToken || data.AccessToken || data.token || data.jwt || '';

    if (!accessToken) {
      throw new Error('REFRESH_INVALID_RESPONSE');
    }

    setAuthToken(accessToken);

    const user = data.user || data.User;
    if (user) {
      setStoredUserProfile(user);
    }

    return accessToken;
  }

  throw new Error('REFRESH_FAILED');
}
