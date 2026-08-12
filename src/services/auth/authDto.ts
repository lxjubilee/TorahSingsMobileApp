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

/**
 * GET /api/auth/lookup?email= — the first door of the one-door flow. Reports
 * whether the address is known to the shared Jubilee Account authority
 * (`existsInSso`) and/or already has a local Torah Sings row (`existsLocally`),
 * which is what picks the branch. `available: false` means the authority
 * couldn't be reached, so the answer is a guess.
 */
export interface LookupResponseDTO {
  exists: boolean;
  existsInSso: boolean;
  existsLocally: boolean;
  available: boolean;
}

/**
 * POST /api/auth/signin body. `deviceInfo` is a tolerated extra (server ignores).
 *
 * The SSO-mode extras drive the one-door flow's later phases:
 *  - `preview`   — verify the Jubilee Account credential and ROUTE without
 *                  committing (no local account is created).
 *  - `provision` — create the local Torah Sings account for a confirmed Jubilee
 *                  Account. Plain sign-in omits it so a deleted account is never
 *                  resurrected just because the authority still holds the password.
 *  - the snake_case name/DOB fields carry edits made on the create form; the
 *    server syncs them back to the shared Jubilee Account before provisioning.
 */
export interface SigninRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  cfTurnstileToken?: string;
  deviceInfo?: DeviceInfo;
  /** Inline 2FA completion (local mode re-POSTs the code to /signin). */
  verificationGuid?: string;
  verificationCode?: string;
  preview?: boolean;
  provision?: boolean;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
}

/** Profile the authority holds for a Jubilee Account, used to pre-fill the create form. */
export interface SsoProfileDTO {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string | null;
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
/**
 * SSO mode: the password checked out at the authority but there's no local Torah
 * Sings account yet. Arrives as HTTP 200 with NO tokens — the caller must route to
 * the create form rather than treat it as a session.
 */
export interface NeedsProfileDTO {
  success: false;
  needsProfile: true;
  profile: SsoProfileDTO;
}
/** SSO preview: no Jubilee Account for this email → send them to full registration. */
export interface SignupRedirectDTO {
  success: false;
  redirect: 'signup';
}
export type SigninResponseDTO =
  | AuthSuccessDTO
  | TwoFactorChallengeDTO
  | NeedsProfileDTO
  | SignupRedirectDTO;

export const isTwoFactor = (r: SigninResponseDTO): r is TwoFactorChallengeDTO =>
  (r as TwoFactorChallengeDTO).requires2FA === true;

export const isNeedsProfile = (r: SigninResponseDTO): r is NeedsProfileDTO =>
  (r as NeedsProfileDTO).needsProfile === true;

export const isSignupRedirect = (r: SigninResponseDTO): r is SignupRedirectDTO =>
  (r as SignupRedirectDTO).redirect === 'signup';

/** Tokens are the only proof of a real session — every other shape is a routing hint. */
export const isAuthSuccess = (r: SigninResponseDTO): r is AuthSuccessDTO =>
  (r as AuthSuccessDTO).tokens != null;

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
