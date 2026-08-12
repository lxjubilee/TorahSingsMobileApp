import { authEndpoints } from './authEndpoints';
import { isAuthSuccess, isNeedsProfile, isSignupRedirect, isTwoFactor } from './authDto';
import type { LookupResponseDTO, SsoProfileDTO } from './authDto';
import { AuthUser, mapUser } from './authMappers';
import { tokenStore } from './tokenStore';
import { buildDeviceInfo } from './deviceInfo';
import { configureAuthClient } from './authClient';
import { clearSessionCookies } from './cookieJar';

/**
 * Every outcome `/api/auth/signin` can produce. Only `authenticated` carries
 * tokens — the rest are routing instructions for the one-door flow, and all four
 * arrive as HTTP 200, so the caller must discriminate before storing anything.
 */
export type SignInResult =
  | { kind: 'authenticated'; user: AuthUser }
  | { kind: '2fa'; verificationGuid: string }
  | { kind: 'needsProfile'; profile: SsoProfileDTO }
  | { kind: 'redirectSignup' };

/** Extra fields the one-door flow layers onto a sign-in call. */
export interface SignInOptions {
  cfTurnstileToken?: string;
  /** Verify the credential and route WITHOUT creating a local account. */
  preview?: boolean;
  /** Create the local account for a confirmed Jubilee Account. */
  provision?: boolean;
  firstName?: string;
  lastName?: string;
  /** `yyyy-mm-dd`. */
  dateOfBirth?: string;
  /** Inline 2FA completion. */
  verificationGuid?: string;
  verificationCode?: string;
}

export interface SignupChallenge {
  verificationGuid: string;
  email: string;
}

/**
 * Wires the auth client's refresh/failure hooks to the token store. `onAuthFailure`
 * is called when a refresh fails (session truly dead) — the app should sign out.
 * Call once at startup.
 */
export function initAuthClient(onAuthFailure: () => void): void {
  configureAuthClient({
    getRefreshToken: () => tokenStore.getRefreshToken(),
    persistTokens: ({ accessToken, refreshToken, expiresAt }) => {
      void tokenStore.updateTokens(accessToken, refreshToken, expiresAt);
    },
    onAuthFailure,
  });
  // Flush any jv_session cookie persisted from a previous run so mutations
  // (logout/change-password/delete) aren't treated as cookie requests → CSRF 403.
  void clearSessionCookies();
}

export const authService = {
  /**
   * Look the email up at the Jubilee Account authority. Drives the one-door
   * branch: local row → sign in, Jubilee Account only → confirm, neither → create.
   */
  lookupEmail(email: string): Promise<LookupResponseDTO> {
    return authEndpoints.lookup(email);
  },

  /**
   * Email + password sign-in. Resolves to a session, a 2FA challenge, or — in SSO
   * mode — a routing hint (the credential is good but there's no local account
   * yet, or there's no Jubilee Account at all). Tokens are only stored on a real
   * session; the hint responses are HTTP 200 with no tokens at all.
   */
  async signIn(
    email: string,
    password: string,
    rememberMe: boolean,
    options: SignInOptions = {},
  ): Promise<SignInResult> {
    const deviceInfo = await buildDeviceInfo();
    const res = await authEndpoints.signin({
      email,
      password,
      rememberMe,
      cfTurnstileToken: options.cfTurnstileToken,
      deviceInfo,
      verificationGuid: options.verificationGuid,
      verificationCode: options.verificationCode,
      ...(options.preview ? { preview: true } : {}),
      ...(options.provision ? { provision: true } : {}),
      ...(options.firstName ? { first_name: options.firstName } : {}),
      ...(options.lastName ? { last_name: options.lastName } : {}),
      ...(options.dateOfBirth ? { date_of_birth: options.dateOfBirth } : {}),
    });
    if (isTwoFactor(res)) {
      return { kind: '2fa', verificationGuid: res.verificationGuid };
    }
    if (isNeedsProfile(res)) {
      return { kind: 'needsProfile', profile: res.profile ?? {} };
    }
    if (isSignupRedirect(res)) {
      return { kind: 'redirectSignup' };
    }
    if (!isAuthSuccess(res)) {
      // A 200 we don't recognise. Better a clear error than a half-built session.
      throw new Error('Sign in failed. Please try again.');
    }
    await tokenStore.save(res.tokens);
    return { kind: 'authenticated', user: mapUser(res.user) };
  },

  /** Complete a 2FA challenge with the emailed OTP code. */
  async verify2FA(
    email: string,
    code: string,
    verificationGuid: string,
    rememberMe: boolean,
  ): Promise<AuthUser> {
    const res = await authEndpoints.verifyLogin({
      email,
      verificationGuid,
      verificationCode: code,
      rememberMe,
    });
    await tokenStore.save(res.tokens);
    return mapUser(res.user);
  },

  // --- Sign up ---

  /** Phase 1: request a 6-digit email verification code. No account yet. */
  async requestSignup(name: string, email: string, password: string): Promise<SignupChallenge> {
    const res = await authEndpoints.signup({ name: name.trim(), email: email.trim(), password });
    return { verificationGuid: res.verificationGuid, email: res.email };
  },

  /** Phase 2: confirm the code → account created + tokens issued (logged in). */
  async verifySignup(verificationGuid: string, verificationCode: string): Promise<AuthUser> {
    const res = await authEndpoints.verifySignup({
      verificationGuid,
      verificationCode: verificationCode.trim(),
      rememberMe: true,
    });
    await tokenStore.save(res.tokens);
    return mapUser(res.user);
  },

  /** Resend the sign-up code for an in-progress sign-up. */
  resendSignup(verificationGuid: string) {
    return authEndpoints.sendSignupVerification(verificationGuid);
  },

  /** Resend the 2FA code for an in-progress sign-in. */
  resendLogin(email: string, verificationGuid: string) {
    return authEndpoints.sendLoginVerification(email.trim(), verificationGuid);
  },

  // --- Password / account ---

  /** Request a password-reset email (redeemed on the website). Always succeeds. */
  async forgotPassword(email: string): Promise<string> {
    const res = await authEndpoints.forgotPassword(email.trim());
    return res.message;
  },

  /**
   * Change the signed-in user's password (Bearer-authed). The server revokes the
   * user's other sessions; we pass the current refresh token so this session
   * stays alive. Cross-platform password sync to JubileeInspire is handled
   * server-side by the change-password handler — the mobile client never touches
   * JI's admin endpoints. See `API docs/API.md`.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await authEndpoints.changePassword({
      current_password: currentPassword,
      new_password: newPassword,
      refreshToken: tokenStore.getRefreshToken() ?? undefined,
    });
  },

  /** Permanently delete the signed-in user's account (Bearer-authed, irreversible). */
  async deleteAccount(): Promise<void> {
    await authEndpoints.deleteAccount();
    await tokenStore.clear(); // session is revoked server-side; drop local tokens
  },

  /** Restore a persisted session on cold start; null if none/invalid. */
  async restoreSession(): Promise<AuthUser | null> {
    const tokens = await tokenStore.load();
    if (!tokens) return null;
    try {
      const me = await authEndpoints.me(); // 401 → interceptor refreshes transparently
      if (me.authenticated && me.user) return mapUser(me.user);
    } catch {
      // fall through to clear
    }
    await tokenStore.clear();
    return null;
  },

  async signOut(): Promise<void> {
    // Drop the session cookie first so the logout POST isn't seen as a cookie
    // request (which would demand CSRF and 403). We authenticate via Bearer.
    await clearSessionCookies();
    try {
      await authEndpoints.logout(tokenStore.getRefreshToken() ?? undefined);
    } catch {
      // best-effort; clear locally regardless
    }
    await tokenStore.clear();
  },
};
