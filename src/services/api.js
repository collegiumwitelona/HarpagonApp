import axios from "axios";
import {
  isMutatingRequest,
  shouldSkipActionThrottle,
  tryConsumeMutation,
} from "../utils/actionThrottle";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  headers: {
    Accept: "application/json",
  },
});

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