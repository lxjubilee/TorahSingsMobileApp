import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authService } from '@/services/auth';
import type { AuthUser } from '@/services/auth';
import type { ApiError } from '@/services/api';

export type { AuthUser };

export type AuthStatus = 'restoring' | 'idle' | 'loading' | 'authenticated' | 'error';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  /** Set when sign-in returned a 2FA challenge; drives the TwoFactor screen. */
  pending2FA: { verificationGuid: string; email: string } | null;
  /** Set after sign-up phase 1; drives the VerifySignup screen. */
  pendingSignup: { verificationGuid: string; email: string } | null;
  /**
   * True only when a session was *restored* on app launch (cold start) — the
   * "Choose your profile" gate then shows once. A fresh in-session sign-in skips
   * the gate and goes straight to Home.
   */
  profileGatePending: boolean;
}

const initialState: AuthState = {
  user: null,
  status: 'restoring', // App dispatches restoreSession() on launch.
  error: null,
  pending2FA: null,
  pendingSignup: null,
  profileGatePending: false,
};

const errMessage = (e: unknown): string =>
  (e as ApiError)?.message ?? (e as Error)?.message ?? 'Something went wrong';

/** Cold-start: rebuild the session from secure storage (validates via /me). */
export const restoreSession = createAsyncThunk('auth/restore', () =>
  authService.restoreSession(),
);

/** Email + password sign-in. May resolve to a 2FA challenge instead of a user. */
export const signIn = createAsyncThunk(
  'auth/signIn',
  (
    args: { email: string; password: string; rememberMe?: boolean; cfTurnstileToken?: string },
    { rejectWithValue },
  ) =>
    authService
      .signIn(args.email.trim(), args.password, args.rememberMe ?? true, args.cfTurnstileToken)
      .catch((e) => rejectWithValue(errMessage(e))),
);

/** Complete a 2FA challenge with the emailed OTP code. Email + guid come from `pending2FA`. */
export const verify2FA = createAsyncThunk(
  'auth/verify2FA',
  (args: { code: string; trustDevice?: boolean }, { getState, rejectWithValue }) => {
    const { pending2FA } = (getState() as { auth: AuthState }).auth;
    if (!pending2FA) return rejectWithValue('Your verification session expired. Please sign in again.');
    return authService
      .verify2FA(pending2FA.email, args.code.trim(), pending2FA.verificationGuid, args.trustDevice ?? true)
      .catch((e) => rejectWithValue(errMessage(e)));
  },
);

export const signOut = createAsyncThunk('auth/signOut', () => authService.signOut());

/** Sign-up phase 1: request the emailed verification code. */
export const requestSignup = createAsyncThunk(
  'auth/requestSignup',
  (args: { name: string; email: string; password: string }, { rejectWithValue }) =>
    authService
      .requestSignup(args.name, args.email, args.password)
      .catch((e) => rejectWithValue(errMessage(e))),
);

/** Sign-up phase 2: confirm the code → account created + tokens issued (logged in). */
export const verifySignup = createAsyncThunk(
  'auth/verifySignup',
  (args: { verificationGuid: string; verificationCode: string }, { rejectWithValue }) =>
    authService
      .verifySignup(args.verificationGuid, args.verificationCode)
      .catch((e) => rejectWithValue(errMessage(e))),
);

/** Resend the sign-up verification code. Returns resend metadata. */
export const resendSignup = createAsyncThunk(
  'auth/resendSignup',
  (verificationGuid: string, { rejectWithValue }) =>
    authService.resendSignup(verificationGuid).catch((e) => rejectWithValue(errMessage(e))),
);

/** Request a password-reset email (redeemed on the website). Returns its message. */
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  (email: string, { rejectWithValue }) =>
    authService.forgotPassword(email).catch((e) => rejectWithValue(errMessage(e))),
);

/** Change the signed-in user's password (Bearer-authed; keeps this session, revokes others). */
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  (args: { currentPassword: string; newPassword: string }, { rejectWithValue }) =>
    authService
      .changePassword(args.currentPassword, args.newPassword)
      .catch((e) => rejectWithValue(errMessage(e))),
);

/** Permanently delete the signed-in user's account (Bearer-authed), then sign out. */
export const deleteAccount = createAsyncThunk(
  'auth/deleteAccount',
  (_: void, { rejectWithValue }) =>
    authService.deleteAccount().catch((e) => rejectWithValue(errMessage(e))),
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Clears auth locally without a network call (used on refresh failure). */
    clearSession(state) {
      state.user = null;
      state.status = 'idle';
      state.error = null;
      state.pending2FA = null;
      state.pendingSignup = null;
      state.profileGatePending = false;
    },
    clearAuthError(state) {
      state.error = null;
    },
    /** User picked a profile on the launch gate → proceed to the app. */
    markProfileSelected(state) {
      state.profileGatePending = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // restore
      .addCase(restoreSession.pending, (state) => {
        state.status = 'restoring';
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = action.payload ? 'authenticated' : 'idle';
        // Only a restored (cold-start) session shows the profile gate.
        state.profileGatePending = action.payload != null;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.status = 'idle';
      })
      // signIn
      .addCase(signIn.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        if (action.payload.kind === '2fa') {
          state.status = 'idle';
          // verify-login needs the email; carry it from the sign-in args.
          state.pending2FA = {
            verificationGuid: action.payload.verificationGuid,
            email: action.meta.arg.email.trim(),
          };
        } else {
          state.user = action.payload.user;
          state.status = 'authenticated';
          state.pending2FA = null;
          state.profileGatePending = false; // fresh sign-in → straight to Home
        }
      })
      .addCase(signIn.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) ?? 'Sign in failed';
      })
      // verify2FA
      .addCase(verify2FA.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(verify2FA.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'authenticated';
        state.pending2FA = null;
        state.profileGatePending = false; // fresh sign-in → straight to Home
      })
      .addCase(verify2FA.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) ?? 'Verification failed';
      })
      // signOut
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
        state.error = null;
        state.pending2FA = null;
        state.pendingSignup = null;
      })
      // requestSignup (phase 1)
      .addCase(requestSignup.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(requestSignup.fulfilled, (state, action) => {
        state.status = 'idle';
        state.pendingSignup = action.payload;
      })
      .addCase(requestSignup.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) ?? 'Sign up failed';
      })
      // verifySignup (phase 2) → logged in
      .addCase(verifySignup.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(verifySignup.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'authenticated';
        state.pending2FA = null;
        state.pendingSignup = null;
        state.profileGatePending = false;
      })
      .addCase(verifySignup.rejected, (state, action) => {
        state.status = 'error';
        state.error = (action.payload as string) ?? 'Verification failed';
      });
    // deleteAccount: the screen shows a themed success dialog, then dispatches
    // clearSession() on acknowledge to reset auth + redirect to Sign In.
  },
});

export const { clearSession, clearAuthError, markProfileSelected } = authSlice.actions;
export default authSlice.reducer;
