
export const getAuthToken = () => {
  const rawToken = localStorage.getItem('token') || '';
  return rawToken
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/^Bearer\s+/i, '');
};


export const hasAuthToken = () => {
  return !!getAuthToken();
};


export const getRawAuthToken = () => {
  return localStorage.getItem('token') || '';
};


export const getStoredUserProfile = () => {
  try {
    const rawProfile = localStorage.getItem('userProfile');
    if (!rawProfile) {
      return null;
    }

    const parsedProfile = JSON.parse(rawProfile);
    return parsedProfile && typeof parsedProfile === 'object' ? parsedProfile : null;
  } catch {
    return null;
  }
};


export const removeAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userProfile');
};


export const setAuthToken = (token) => {
  if (typeof token === 'string' && token.trim()) {
    const cleanToken = token
      .trim()
      .replace(/^"|"$/g, '')
      .replace(/^Bearer\s+/i, '');
    localStorage.setItem('token', cleanToken);
  }
};


export const setRefreshToken = (refreshToken) => {
  if (typeof refreshToken === 'string' && refreshToken.trim()) {
    localStorage.setItem('refreshToken', refreshToken.trim().replace(/^"|"$/g, ''));
  }
};


export const setStoredUserProfile = (profile) => {
  if (!profile || typeof profile !== 'object') {
    return;
  }

  const normalizedProfile = {
    id: profile.id || profile.userId || '',
    email: profile.email || '',
    name: profile.name || profile.firstName || '',
    surname: profile.surname || profile.lastName || '',
  };

  localStorage.setItem('userProfile', JSON.stringify(normalizedProfile));
};
