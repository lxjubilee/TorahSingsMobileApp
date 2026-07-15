import { authClient } from './authClient';
import {
  ChangePasswordRequest,
  ChangePasswordResponseDTO,
  ForgotPasswordResponseDTO,
  MeResponseDTO,
  RefreshResponseDTO,
  ResendResponseDTO,
  SigninRequest,
  SigninResponseDTO,
  SignupRequest,
  SignupResponseDTO,
  AuthSuccessDTO,
  VerifyLoginRequest,
  VerifySignupRequest,
} from './authDto';

/**
 * Typed endpoint functions for the unified jubilujah-api (`API docs/API.md`).
 * The only place auth URLs are declared. Every call goes through `authClient`
 * (Bearer auth + transparent 401 refresh).
 */
export const authEndpoints = {
  // --- Sign in / 2FA ---
  signin: (body: SigninRequest) =>
    authClient.post<SigninResponseDTO>('/api/auth/signin', body).then((r) => r.data),

  verifyLogin: (body: VerifyLoginRequest) =>
    authClient.post<AuthSuccessDTO>('/api/auth/verify-login', body).then((r) => r.data),

  sendLoginVerification: (email: string, verificationGuid: string) =>
    authClient
      .post<ResendResponseDTO>('/api/auth/send-login-verification', { email, verificationGuid })
      .then((r) => r.data),

  // --- Sign up ---
  signup: (body: SignupRequest) =>
    authClient.post<SignupResponseDTO>('/api/auth/signup', body).then((r) => r.data),

  verifySignup: (body: VerifySignupRequest) =>
    authClient.post<AuthSuccessDTO>('/api/auth/verify-signup', body).then((r) => r.data),

  sendSignupVerification: (verificationGuid: string) =>
    authClient
      .post<ResendResponseDTO>('/api/auth/send-signup-verification', { verificationGuid })
      .then((r) => r.data),

  // --- Session / tokens ---
  refresh: (refreshToken: string) =>
    authClient.post<RefreshResponseDTO>('/api/auth/refresh', { refreshToken }).then((r) => r.data),

  me: () => authClient.get<MeResponseDTO>('/api/auth/me').then((r) => r.data),

  logout: (refreshToken?: string) =>
    authClient.post('/api/auth/logout', { refreshToken }).then((r) => r.data),

  logoutAll: () => authClient.post('/api/auth/logout-all').then((r) => r.data),

  // --- Password / account ---
  forgotPassword: (email: string) =>
    authClient
      .post<ForgotPasswordResponseDTO>('/api/auth/forgot-password', { email })
      .then((r) => r.data),

  changePassword: (body: ChangePasswordRequest) =>
    authClient
      .post<ChangePasswordResponseDTO>('/api/auth/change-password', body)
      .then((r) => r.data),

  deleteAccount: () => authClient.delete('/api/auth/account').then((r) => r.data),
};
