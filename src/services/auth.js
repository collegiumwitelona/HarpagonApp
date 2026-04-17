export const getAuthToken = () => {
  const rawToken = localStorage.getItem('token') || '';

  return rawToken
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/^Bearer\s+/i, '');
};

export const isAuthenticated = () => Boolean(getAuthToken());

const decodeJwtPayload = (token) => {
  try {
    const parts = String(token || '').split('.');
    if (parts.length < 2) return null;

    const payloadBase64Url = parts[1];
    const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const getUserRole = (tokenOverride) => {
  const token = tokenOverride || getAuthToken();
  const payload = decodeJwtPayload(token);

  if (!payload || typeof payload !== 'object') {
    return '';
  }

  return (
    payload.role ||
    payload.roles?.[0] ||
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
    ''
  );
};

export const isAdmin = (tokenOverride) =>
  String(getUserRole(tokenOverride)).toLowerCase() === 'admin';

export const getUserName = (tokenOverride) => {
  const token = tokenOverride || getAuthToken();
  const payload = decodeJwtPayload(token);

  if (!payload || typeof payload !== 'object') {
    return '';
  }

  return (
    payload.given_name ||
    payload.name ||
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] ||
    ''
  );
};

export const getUserSurname = (tokenOverride) => {
  const token = tokenOverride || getAuthToken();
  const payload = decodeJwtPayload(token);

  if (!payload || typeof payload !== 'object') {
    return '';
  }

  return (
    payload.family_name ||
    payload.surname ||
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] ||
    ''
  );
};
