/**
 * DTOs for the unified jubilujah-api auth surface (`/api/auth/*`). See
 * `API docs/API.md`. The API is Bearer-token based; responses carry tokens
 * directly (no cookies). Kept separate from the AuthUser domain model —
 * `authMappers.ts` adapts between them.
 */

export interface UserDTO {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  roles?: string[];
  accountType?: string;
  accountId?: string;
  isAccountPrimary?: boolean;
  subscriptionStatus?: string;
  subscriptionPeriod?: string;
  profile_picture_url?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

/** Access + refresh tokens issued by signin/verify/refresh. */
export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  platform: string;
  appName: string;
  appVersion: string;
  language?: string;
}

/** POST /api/auth/signin body. `deviceInfo` is a tolerated extra (server ignores). */
export interface SigninRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  cfTurnstileToken?: string;
  deviceInfo?: DeviceInfo;
}

/** Signin resolves to tokens OR a 2FA challenge. */
export interface AuthSuccessDTO {
  user: UserDTO;
  tokens: Tokens;
}
export interface TwoFactorChallengeDTO {
  requires2FA: true;
  verificationGuid: string;
}
export type SigninResponseDTO = AuthSuccessDTO | TwoFactorChallengeDTO;

export const isTwoFactor = (r: SigninResponseDTO): r is TwoFactorChallengeDTO =>
  (r as TwoFactorChallengeDTO).requires2FA === true;

/** POST /api/auth/verify-login body (2FA step 2). */
export interface VerifyLoginRequest {
  email: string;
  verificationGuid: string;
  verificationCode: string;
  rememberMe?: boolean;
}

/** POST /api/auth/signup body — request a verification code (no account yet). */
export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}
export interface SignupResponseDTO {
  success: boolean;
  requiresVerification: boolean;
  verificationGuid: string;
  email: string;
}

/** POST /api/auth/verify-signup body (step 2). Returns user + tokens. */
export interface VerifySignupRequest {
  verificationGuid: string;
  verificationCode: string;
  rememberMe?: boolean;
}

/** POST /api/auth/send-signup-verification & /send-login-verification response. */
export interface ResendResponseDTO {
  success: boolean;
  resendsRemaining?: number;
}

/** POST /api/auth/refresh response — tokens are nested; the refresh token rotates. */
export interface RefreshResponseDTO {
  tokens: Tokens;
}

/** POST /api/auth/forgot-password response (anti-enumeration; always succeeds). */
export interface ForgotPasswordResponseDTO {
  ok: boolean;
  message: string;
}

/** POST /api/auth/change-password body (Bearer-authed) — note snake_case fields. */
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  /** Optional: keep the current session by passing its refresh token. */
  refreshToken?: string;
}
export interface ChangePasswordResponseDTO {
  ok: boolean;
  jiSync?: boolean;
}

/** GET /api/auth/me — verb-agnostic session check (works unauthenticated). */
export interface MeResponseDTO {
  authenticated: boolean;
  user?: UserDTO;
  roles?: string[];
}
