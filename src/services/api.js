import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  headers: {
    Accept: "application/json",
  },
});
console.log(import.meta.env.VITE_API_URL);

api.interceptors.request.use((config) => {
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