import { isActionThrottledError } from './actionThrottle';

export const extractApiErrorCodes = (data) => {
  if (!data) {
    return [];
  }

  if (Array.isArray(data.errors)) {
    return data.errors.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (typeof data.errors === 'object' && data.errors) {
    return Object.values(data.errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return [data.message.trim()];
  }

  return [];
};

const CODE_TO_TRANSLATION_KEY = {
  Auth_InvalidCredentials: 'auth.invalidCredentials',
  Auth_EmailNotConfirmed: 'auth.emailNotConfirmed',
  Auth_EmailIsAlreadyTaken: 'auth.registerError',
  EmailConfirmation_InvalidToken: 'auth.confirmInvalidLink',
  ResetPassword_InvalidToken: 'auth.resetInvalidLink',
  User_NotFound: 'auth.resetInvalidUser',
};

const SECURITY_GENERIC_CODES = new Set(['Auth_EmailIsAlreadyTaken']);

export const mapApiCodesToMessage = (t, codes, { forceGenericKey } = {}) => {
  if (forceGenericKey) {
    return t(forceGenericKey);
  }

  if (codes.some((code) => SECURITY_GENERIC_CODES.has(code))) {
    return t('auth.registerError');
  }

  for (const code of codes) {
    const translationKey = CODE_TO_TRANSLATION_KEY[code];
    if (translationKey) {
      return t(translationKey);
    }
  }

  return null;
};

export const getResponseErrorMessage = (t, response, fallbackKey) => {
  if (!response) {
    return t('common.networkError');
  }

  if (response.status === 401) {
    return t('common.sessionExpired');
  }

  if (response.status >= 500) {
    return t('common.serverError');
  }

  const mapped = mapApiCodesToMessage(t, extractApiErrorCodes(response.data));
  if (mapped) {
    return mapped;
  }

  if (response.status >= 400) {
    return t(fallbackKey);
  }

  return null;
};

export const getCaughtErrorMessage = (t, error, fallbackKey) => {
  if (!error) {
    return t(fallbackKey);
  }

  if (isActionThrottledError(error)) {
    return null;
  }

  if (error.response) {
    return getResponseErrorMessage(t, error.response, fallbackKey);
  }

  const message = String(error.message || '').trim();
  if (message && !/^https?:\/\//i.test(message) && message.length < 240) {
    return message;
  }

  return t(fallbackKey);
};
