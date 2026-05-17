import { api } from '../services/api';

export const fetchFirstSuccessfulGet = async ({
  requests,
  headers = {},
  baseParams = {},
  baseHeaders = {},
  onUnauthorized,
}) => {
  for (const request of requests) {
    const normalizedRequest = typeof request === 'string' ? { url: request } : request;
    const response = await api.get(normalizedRequest.url, {
      headers: {
        ...headers,
        ...baseHeaders,
        ...(normalizedRequest.headers || {}),
      },
      params: {
        ...baseParams,
        ...(normalizedRequest.params || {}),
      },
      validateStatus: () => true,
    });

    if (response.status === 401) {
      if (onUnauthorized) {
        onUnauthorized();
      }
      return null;
    }

    if (response.status >= 200 && response.status < 300) {
      return response;
    }
  }

  return null;
};
