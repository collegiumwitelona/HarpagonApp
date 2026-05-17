import { api } from '../services/api';

export const extractCollectionData = (responseBody) => {
  if (Array.isArray(responseBody?.data)) {
    return responseBody.data;
  }

  if (Array.isArray(responseBody?.Data)) {
    return responseBody.Data;
  }

  if (Array.isArray(responseBody)) {
    return responseBody;
  }

  return [];
};

export const fetchFirstSuccessfulGet = async ({
  requests,
  headers = {},
  baseParams = {},
  baseHeaders = {},
  onUnauthorized,
}) => {
  for (const request of requests) {
    try {
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
    } catch (error) {
      console.error('Fallback request failed:', error);
    }
  }

  return null;
};

export const fetchAllFromFirstSuccessfulEndpoint = async ({
  requests,
  headers = {},
  baseParams = {},
  baseHeaders = {},
  onUnauthorized,
  pageSize = 250,
  maxPages = 200,
}) => {
  for (const request of requests) {
    const normalizedRequest = typeof request === 'string' ? { url: request } : request;
    const shouldPaginate = normalizedRequest.paginate !== false;

    if (!shouldPaginate) {
      try {
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
          return {
            status: response.status,
            data: extractCollectionData(response.data),
          };
        }
      } catch (error) {
        console.error('Non-paginated fallback request failed:', error);
      }

      continue;
    }

    const mergedParams = {
      ...baseParams,
      ...(normalizedRequest.params || {}),
    };

    const allItems = [];

    for (let page = 0; page < maxPages; page += 1) {
      const start = page * pageSize;

      try {
        const response = await api.get(normalizedRequest.url, {
          headers: {
            ...headers,
            ...baseHeaders,
            ...(normalizedRequest.headers || {}),
          },
          params: {
            ...mergedParams,
            Start: start,
            Length: pageSize,
          },
          validateStatus: () => true,
        });

        if (response.status === 401) {
          if (onUnauthorized) {
            onUnauthorized();
          }
          return null;
        }

        if (response.status === 404 || response.status === 405) {
          if (page === 0) {
            allItems.length = 0;
            break;
          }
          return {
            status: 200,
            data: allItems,
          };
        }

        if (response.status < 200 || response.status >= 300) {
          if (page === 0) {
            allItems.length = 0;
            break;
          }
          return {
            status: 200,
            data: allItems,
          };
        }

        const chunk = extractCollectionData(response.data);
        allItems.push(...chunk);

        if (chunk.length < pageSize) {
          return {
            status: 200,
            data: allItems,
          };
        }
      } catch (error) {
        console.error('Paginated fallback request failed:', error);

        if (page === 0) {
          allItems.length = 0;
          break;
        }

        return {
          status: 200,
          data: allItems,
        };
      }
    }

    if (allItems.length > 0) {
      return {
        status: 200,
        data: allItems,
      };
    }
  }

  return null;
};
