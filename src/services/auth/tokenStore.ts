import * as SecureStore from 'expo-secure-store';
import { logger } from '@/utils';
import { setAccessToken } from './authClient';

/**
 * Encrypted token storage (Keychain/Keystore via expo-secure-store). Keeps an
 * in-memory mirror so the auth client always has the current access token
 * synchronously, and so the refresh interceptor can read the refresh token.
 */
const KEY_ACCESS = 'jubilujah.auth.accessToken';
const KEY_REFRESH = 'jubilujah.auth.refreshToken';
const KEY_EXPIRES = 'jubilujah.auth.expiresAt';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
}

let memo: StoredTokens | null = null;

export const tokenStore = {
  /** In-memory accessors (sync) used by the auth client. */
  getAccessToken: (): string | null => memo?.accessToken ?? null,
  getRefreshToken: (): string | null => memo?.refreshToken ?? null,

  /** Load tokens from secure storage into memory + the client. Returns them. */
  async load(): Promise<StoredTokens | null> {
    try {
      const [accessToken, refreshToken, expiresAt] = await Promise.all([
        SecureStore.getItemAsync(KEY_ACCESS),
        SecureStore.getItemAsync(KEY_REFRESH),
        SecureStore.getItemAsync(KEY_EXPIRES),
      ]);
      if (accessToken && refreshToken) {
        memo = { accessToken, refreshToken, expiresAt: expiresAt ?? undefined };
        setAccessToken(accessToken);
        return memo;
      }
    } catch (e) {
      logger.warn('tokenStore.load failed', e);
    }
    return null;
  },

  async save(tokens: StoredTokens): Promise<void> {
    memo = tokens;
    setAccessToken(tokens.accessToken);
    try {
      await Promise.all([
        SecureStore.setItemAsync(KEY_ACCESS, tokens.accessToken),
        SecureStore.setItemAsync(KEY_REFRESH, tokens.refreshToken),
        tokens.expiresAt
          ? SecureStore.setItemAsync(KEY_EXPIRES, tokens.expiresAt)
          : SecureStore.deleteItemAsync(KEY_EXPIRES),
      ]);
    } catch (e) {
      logger.warn('tokenStore.save failed', e);
    }
  },

  /**
   * Persist a rotated token set after a refresh. The unified API rotates the
   * refresh token on every refresh, so we must store the new one too — keeping
   * the old refresh token would break the next refresh.
   */
  async updateTokens(accessToken: string, refreshToken: string, expiresAt?: string): Promise<void> {
    memo = { accessToken, refreshToken, expiresAt: expiresAt ?? memo?.expiresAt };
    setAccessToken(accessToken);
    try {
      await Promise.all([
        SecureStore.setItemAsync(KEY_ACCESS, accessToken),
        SecureStore.setItemAsync(KEY_REFRESH, refreshToken),
        expiresAt
          ? SecureStore.setItemAsync(KEY_EXPIRES, expiresAt)
          : Promise.resolve(),
      ]);
    } catch (e) {
      logger.warn('tokenStore.updateTokens failed', e);
    }
  },

  async clear(): Promise<void> {
    memo = null;
    setAccessToken(null);
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(KEY_ACCESS),
        SecureStore.deleteItemAsync(KEY_REFRESH),
        SecureStore.deleteItemAsync(KEY_EXPIRES),
      ]);
    } catch (e) {
      logger.warn('tokenStore.clear failed', e);
    }
  },
};
