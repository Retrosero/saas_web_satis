import axios, { type AxiosInstance } from 'axios';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Müşteri/Bayi portalı için ayrı axios client.
 * Token localStorage 'portal_token' anahtarında saklanır (ana auth'tan ayrı).
 */
const PORTAL_TOKEN_KEY = 'portal_token';
const PORTAL_CUSTOMER_KEY = 'portal_customer';

export const portalApi: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

portalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(PORTAL_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

portalApi.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(PORTAL_TOKEN_KEY);
      localStorage.removeItem(PORTAL_CUSTOMER_KEY);
      if (location.pathname.startsWith('/portal') && location.pathname !== '/portal/login') {
        location.href = '/portal/login';
      }
    }
    return Promise.reject(err);
  },
);

export const portalAuth = {
  getToken: () => localStorage.getItem(PORTAL_TOKEN_KEY),
  getCustomer: () => {
    const s = localStorage.getItem(PORTAL_CUSTOMER_KEY);
    return s ? JSON.parse(s) : null;
  },
  setSession: (token: string, customer: { id: string; name: string; code: string }) => {
    localStorage.setItem(PORTAL_TOKEN_KEY, token);
    localStorage.setItem(PORTAL_CUSTOMER_KEY, JSON.stringify(customer));
  },
  clear: () => {
    localStorage.removeItem(PORTAL_TOKEN_KEY);
    localStorage.removeItem(PORTAL_CUSTOMER_KEY);
  },
};
