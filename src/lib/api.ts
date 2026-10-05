import axios from "axios";

import { getToken } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  // Respect an explicit header (e.g. calling /auth/me with a token not yet stored).
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // An expired or revoked token is useless; log out so the UI falls back to logged-out.
    // Only for authenticated requests: a 401 from /auth/login (wrong password) must not
    // log anyone out or wipe a guest's cart.
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config?.headers?.Authorization
    ) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default api;
