import axios, { AxiosError, AxiosInstance } from 'axios';
import { CONFIG, ENV } from '@/constants';
import { logger } from '@/utils';

/**
 * Shared axios instance for the jubileeverse API. Interceptors centralize:
 *  - auth header injection (wired for future auth)
 *  - request/response logging in dev
 *  - error normalization into a consistent ApiError
 */
export interface ApiError {
  status: number;
  message: string;
  raw?: unknown;
}

let authToken: string | null = null;

/** Allows the auth slice to register/clear the bearer token later. */
export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: CONFIG.API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  logger.debug('API →', config.method?.toUpperCase(), config.url);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError: ApiError = {
      status: error.response?.status ?? 0,
      message:
        (error.response?.data as { message?: string })?.message ??
        error.message ??
        'Network request failed',
      raw: error.response?.data,
    };
    logger.error('API ✗', apiError.status, apiError.message);
    return Promise.reject(apiError);
  },
);
