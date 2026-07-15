# 03 — Sign In, Turnstile CAPTCHA & Two-Factor

Covers `SignInScreen.tsx`, `TurnstileWidget.tsx`, `TwoFactorScreen.tsx`, and the
`signIn` / `verify2FA` thunks against `POST /api/auth/signin` and `/verify-login`.

---

### JLM-AUTH-001 — Successful sign-in (no 2FA)
**Category:** Functional, Positive · **Priority:** P0 · **Platform:** Both
**Preconditions:** Signed out; valid credentials for a non-2FA account; Online.
**Steps:**
1. Enter valid email and password.
2. Tap the primary Sign In CTA.
**Expected Result:** Spinner shows while `status==='loading'`; on success the slice flips to
`authenticated`, tokens saved to secure store, and RootGate swaps to the Home tab.

---

### JLM-AUTH-002 — Sign-in CTA disabled until email + password present
**Category:** Boundary, UI/UX · **Priority:** P1 · **Platform:** Both
**Preconditions:** On Sign In.
**Steps:**
1. Leave email empty; observe CTA. Fill email only; observe. Fill password too; observe.
**Expected Result:** CTA is disabled unless both fields are non-empty (and captcha satisfied
if required) and not loading.

---

### JLM-AUTH-003 — Wrong password shows inline error, no navigation
**Category:** Negative · **Priority:** P0 · **Platform:** Both
**Preconditions:** Signed out; valid email, wrong password.
**Steps:**
1. Submit with an incorrect password.
**Expected Result:** Inline `auth.error` message shown; user stays on Sign In; password not
cleared silently in a way that loses context; no crash.

---

### JLM-AUTH-004 — Unknown email shows inline error
**Category:** Negative · **Priority:** P1 · **Platform:** Both
**Preconditions:** Signed out.
**Steps:**
1. Submit with an email that has no account.
**Expected Result:** Inline error (generic; does not confirm/deny account existence beyond
server message); stays on Sign In.

---

### JLM-AUTH-005 — Password show/hide toggle
**Category:** UI/UX · **Priority:** P2 · **Platform:** Both
**Preconditions:** On Sign In.
**Steps:**
1. Type a password; tap the show/hide eye icon twice.
**Expected Result:** Toggles between masked and plaintext; state is per-field and does not
leak into logs.

---

### JLM-AUTH-006 — Error clears on screen focus
**Category:** UI/UX · **Priority:** P2 · **Platform:** Both
**Preconditions:** Sign-in error currently displayed.
**Steps:**
1. Navigate away (e.g. Forgot password) and back to Sign In.
**Expected Result:** `clearAuthError` runs on focus; the stale inline error is gone.

---

### JLM-AUTH-007 — 2FA challenge routes to Two-Factor screen
**Category:** Functional, Positive · **Priority:** P0 · **Platform:** Both
**Preconditions:** Signed out; credentials for a **2FA-enabled** account.
**Steps:**
1. Submit valid credentials.
**Expected Result:** `signIn` resolves with `kind:'2fa'`; app navigates to **TwoFactor**
carrying `pending2FA` (verificationGuid). No session yet.

---

### JLM-AUTH-008 — Valid OTP completes 2FA sign-in
**Category:** Functional, Positive · **Priority:** P0 · **Platform:** Both
**Preconditions:** On TwoFactor with a valid `pending2FA`.
**Steps:**
1. Enter the correct 4–6 digit code; submit.
**Expected Result:** `verify2FA` succeeds → tokens + user set → authenticated → Home.

---

### JLM-AUTH-009 — 2FA code field accepts digits only, max 6
**Category:** Boundary, Negative · **Priority:** P1 · **Platform:** Both
**Preconditions:** On TwoFactor.
**Steps:**
1. Try typing letters/symbols; try typing 7 digits.
**Expected Result:** Non-digits rejected; input caps at 6 characters; submit stays disabled
below 4 digits and while loading, and requires a present `pending2FA`.

---

### JLM-AUTH-010 — Wrong OTP shows inline error, stays on screen
**Category:** Negative · **Priority:** P0 · **Platform:** Both
**Preconditions:** On TwoFactor.
**Steps:**
1. Enter an incorrect code; submit.
**Expected Result:** Inline error; remains on TwoFactor; can retry.

---

### JLM-AUTH-011 — Expired 2FA challenge is rejected clearly
**Category:** Negative, Boundary · **Priority:** P1 · **Platform:** Both
**Preconditions:** On TwoFactor; let `pending2FA` expire (or backend expires it).
**Steps:**
1. Submit a code after expiry.
**Expected Result:** Rejected with a "session expired" style message; user can go back and
re-initiate sign-in.

---

### JLM-AUTH-012 — "Trust this device" checkbox default and effect
**Category:** Functional, Security · **Priority:** P2 · **Platform:** Both
**Preconditions:** On TwoFactor.
**Steps:**
1. Note the checkbox default; complete 2FA with it ON, then in a later sign-in with it OFF.
**Expected Result:** Defaults to ON; value is passed through as `rememberMe`. Behavior
matches server trust policy (trusted device may skip future 2FA per backend rules).

---

### JLM-AUTH-013 — Turnstile CAPTCHA shown only when configured
**Category:** Security, Integration · **Priority:** P1 · **Platform:** Both
**Preconditions:** (a) `TURNSTILE_SITE_KEY` empty, (b) site key set.
**Steps:**
1. Open Sign In in each config.
**Expected Result:** (a) No CAPTCHA; submit needs only email+password. (b) TurnstileWidget
renders; submit is blocked until a token is obtained; token passed to `signIn`.

---

### JLM-AUTH-014 — Turnstile token is single-use; widget remounts on failed attempt
**Category:** Security, Regression · **Priority:** P1 · **Platform:** Both
**Preconditions:** Turnstile enabled; a sign-in attempt fails (wrong password).
**Steps:**
1. Solve CAPTCHA, submit wrong password, then correct it and resubmit.
**Expected Result:** After the failed attempt the widget remounts to issue a fresh token
(the used token isn't replayed); resubmission uses the new token.

---

### JLM-AUTH-015 — Sign-in timeout is not silently retried
**Category:** Integration, Security · **Priority:** P1 · **Platform:** Both
**Preconditions:** Simulate a 30s TCP stall on `/signin`.
**Steps:**
1. Submit valid credentials on a stalled connection.
**Expected Result:** After `API_TIMEOUT_MS` (30s) the request aborts with an error; it is
**not** auto-retried (single-use CAPTCHA/OTP could be consumed). User can retry manually.

---

### JLM-AUTH-016 — Network error on sign-in retries up to twice
**Category:** Integration · **Priority:** P2 · **Platform:** Both
**Preconditions:** Transient `ERR_NETWORK` (request never reaches server).
**Steps:**
1. Submit while connectivity blips.
**Expected Result:** Client retries up to 2× with backoff; if it then succeeds, user signs
in; if it keeps failing, an error is shown. (Distinct from the timeout case above.)

---

### JLM-AUTH-017 — Navigation links from Sign In
**Category:** Functional · **Priority:** P2 · **Platform:** Both
**Preconditions:** On Sign In.
**Steps:**
1. Tap "Forgot password?"; go back. Tap "New? Sign up".
**Expected Result:** Navigate to ForgotPassword and SignUp respectively; back returns to
Sign In with fields preserved as expected.

---

### JLM-AUTH-018 — Back from Sign In goes to Welcome when no history
**Category:** UI/UX · **Priority:** P2 · **Platform:** Both
**Preconditions:** On Sign In reached directly (returning user).
**Steps:**
1. Tap the back arrow.
**Expected Result:** Falls back to Welcome (per screen logic) rather than exiting the app
unexpectedly.

---

### JLM-AUTH-019 — CSRF cookies stripped so sign-in/mutations don't 403
**Category:** Security, Regression · **Priority:** P1 · **Platform:** Both
**Preconditions:** A stale `jv_session`/`jv_csrf` cookie exists.
**Steps:**
1. Sign in and perform a mutation (e.g. like a song).
**Expected Result:** `clearSessionCookies` strips the cookies before each request so the
server treats the app as a pure Bearer client; no 403 on mutations.
