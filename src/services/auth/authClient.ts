import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { CONFIG } from '@/constants';
import { logger } from '@/utils';
import type { ApiError } from '@/services/api';
import { clearSessionCookies } from './cookieJar';

/**
 * Axios instance for the unified jubilujah-api (`API docs/API.md`). Bearer-token
 * auth — the single host for every `/api/auth/*` call. Mirrors
 * services/api/client.ts: an in-memory bearer token + a normalized ApiError.
 * Adds transparent single-flight refresh on 401.
 */
export const authClient: AxiosInstance = axios.create({
  baseURL: CONFIG.API_AUTH_BASE,
  timeout: CONFIG.API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;

/** Set/clear the bearer token used on every auth-client request. */
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

// Injected by the auth wiring so this module stays free of redux/tokenStore imports.
interface RotatedTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
}
interface SessionHandlers {
  getRefreshToken: () => string | null;
  /** Persist the full token set after a refresh (the refresh token rotates). */
  persistTokens: (tokens: RotatedTokens) => void;
  onAuthFailure: () => void;
}
let handlers: SessionHandlers | null = null;
export const configureAuthClient = (h: SessionHandlers): void => {
  handlers = h;
};

const toApiError = (error: AxiosError): ApiError => ({
  status: error.response?.status ?? 0,
  message:
    (error.response?.data as { message?: string; error?: string })?.message ??
    (error.response?.data as { error?: string })?.error ??
    error.message ??
    'Network request failed',
  raw: error.response?.data,
});

// Paths that must never trigger a refresh-retry (the auth handshake itself).
const REFRESH_EXEMPT = ['/api/auth/signin', '/api/auth/refresh', '/api/auth/verify-login'];
const isExempt = (url?: string) => !!url && REFRESH_EXEMPT.some((p) => url.includes(p));

authClient.interceptors.request.use(async (config) => {
  // We are a pure Bearer client. RN's native cookie jar would otherwise replay a
  // server-set `jv_session` cookie on every request, making the server enforce
  // CSRF (→ 403 on signin/logout/etc.). Strip it BEFORE each request — awaited so
  // the jar is empty by the time the native layer builds the request. The app
  // never sends or needs a CSRF token. See `API docs/API.md`.
  await clearSessionCookies();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  logger.debug('AUTH →', config.method?.toUpperCase(), config.url);
  return config;
});

// Single-flight refresh: concurrent 401s share one refresh round-trip.
let refreshPromise: Promise<string> | null = null;

async function runRefresh(): Promise<string> {
  const refreshToken = handlers?.getRefreshToken();
  if (!refreshToken) throw new Error('no refresh token');
  // Bare axios call (no interceptors) to avoid recursive refresh loops — so clear
  // the cookie here too, since the request interceptor doesn't run for it.
  await clearSessionCookies();
  // The unified API rotates the refresh token and nests both under `tokens`.
  const res = await axios.post<{ tokens: { accessToken: string; refreshToken: string; expiresAt?: string } }>(
    `${CONFIG.API_AUTH_BASE}/api/auth/refresh`,
    { refreshToken },
    { timeout: CONFIG.API_TIMEOUT_MS, headers: { 'Content-Type': 'application/json' } },
  );
  const { accessToken, refreshToken: rotated, expiresAt } = res.data.tokens;
  setAccessToken(accessToken);
  // Persist the rotated refresh token too — the old one is now invalid.
  handlers?.persistTokens({ accessToken, refreshToken: rotated, expiresAt });
  return accessToken;
}

authClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean; _netRetries?: number })
      | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !isExempt(original.url) && handlers) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise ?? runRefresh();
        const newToken = await refreshPromise;
        refreshPromise = null;
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return authClient(original);
      } catch (refreshErr) {
        refreshPromise = null;
        logger.warn('AUTH refresh failed — signing out', refreshErr);
        handlers.onAuthFailure();
        return Promise.reject(toApiError(error));
      }
    }

    // No response AND no connection established (the server's intermittent connect
    // stalls / transient DNS). ERR_NETWORK means the request never reached the
    // server, so retrying is safe even for the single-use CAPTCHA token on signin.
    // (A timeout — ECONNABORTED — is NOT retried: the server may have received it.)
    if (error.code === 'ERR_NETWORK' && original && (original._netRetries ?? 0) < 2) {
      original._netRetries = (original._netRetries ?? 0) + 1;
      logger.warn(`AUTH retry ${original._netRetries}/2 after ERR_NETWORK`, original.url);
      await new Promise((r) => setTimeout(r, 500 * (original._netRetries ?? 1)));
      return authClient(original);
    }

    const apiError = toApiError(error);
    logger.error('AUTH ✗', apiError.status, apiError.message, error.code ?? '', original?.url ?? '');
    return Promise.reject(apiError);
  },
);
