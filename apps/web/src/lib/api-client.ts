import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth-store';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';
const TIMEOUT = 30_000;

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — access token ekle
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — 401 → refresh dene, hata → Türkçe toast
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; error?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 — token yenilemeyi dene
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            if (token) originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true },
        );
        const newAccess = res.data?.data?.accessToken;
        const newRefresh = res.data?.data?.refreshToken;
        if (newAccess) {
          useAuthStore.getState().setTokens(newAccess, newRefresh ?? refreshToken);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          refreshQueue.forEach((cb) => cb(newAccess));
          refreshQueue = [];
          return apiClient(originalRequest);
        }
        useAuthStore.getState().logout();
        return Promise.reject(error);
      } catch (refreshErr) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Diğer hatalar — Türkçe mesaj
    const message = error.response?.data?.message ?? error.message ?? 'Beklenmeyen bir hata oluştu';
    if (error.response?.status !== 401 && error.response?.status !== 422) {
      toast.error(message);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
