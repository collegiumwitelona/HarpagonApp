import axios from "axios";
import {
  isMutatingRequest,
  shouldSkipActionThrottle,
  tryConsumeMutation,
} from "../utils/actionThrottle";
import { getRefreshToken } from "../utils/tokenHelper";
import {
  refreshAccessToken,
  redirectToLogin,
  shouldSkipTokenRefresh,
} from "./authRefresh";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  headers: {
    Accept: "application/json",
  },
});

let isRefreshing = false;
let refreshQueue = [];

const enqueueRefresh = () =>
  new Promise((resolve, reject) => {
    refreshQueue.push({ resolve, reject });
  });

const flushRefreshQueue = (error) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  refreshQueue = [];
};

const handleUnauthorized = async (config, failedResponse) => {
  if (!config || shouldSkipTokenRefresh(config)) {
    return failedResponse;
  }

  if (config._retry) {
    redirectToLogin();
    return failedResponse;
  }

  if (!getRefreshToken()) {
    redirectToLogin();
    return failedResponse;
  }

  if (isRefreshing) {
    try {
      await enqueueRefresh();
      return api({ ...config, _retry: true });
    } catch {
      return failedResponse;
    }
  }

  isRefreshing = true;

  try {
    await refreshAccessToken();
    flushRefreshQueue(null);
    return api({ ...config, _retry: true });
  } catch {
    flushRefreshQueue(new Error("REFRESH_FAILED"));
    redirectToLogin();
    return failedResponse;
  } finally {
    isRefreshing = false;
  }
};

api.interceptors.request.use((config) => {
  if (
    isMutatingRequest(config) &&
    !shouldSkipActionThrottle(config) &&
    !tryConsumeMutation()
  ) {
    const error = new axios.CanceledError("Action throttled");
    error.code = "ACTION_THROTTLED";
    return Promise.reject(error);
  }

  const language = localStorage.getItem("language") === "en" ? "en-US" : "pl-PL";

  config.headers["Accept-Language"] = language;

  const rawToken = localStorage.getItem("token") || "";
  const token = rawToken
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/^Bearer\s+/i, "");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  async (response) => {
    if (response.status !== 401) {
      return response;
    }

    return handleUnauthorized(response.config, response);
  },
  async (error) => {
    if (error?.response?.status !== 401 || !error.config) {
      return Promise.reject(error);
    }

    const retried = await handleUnauthorized(error.config, error.response);
    if (retried && retried !== error.response && retried.status !== 401) {
      return retried;
    }

    return Promise.reject(error);
  }
);
