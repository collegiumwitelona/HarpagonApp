import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
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