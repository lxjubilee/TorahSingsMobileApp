# 04 — Sign Up & Verification

Covers `SignUpScreen.tsx` (phase 1, `requestSignup`), the custom `DateField` wheel,
and `VerifySignupScreen.tsx` (phase 2 OTP, `verifySignup` / `resendSignup`).

> Note: sign-up creates a **real account**. Use a fresh, unused email for each run.

---

### JLM-SGNP-001 — Successful sign-up end-to-end
**Category:** Functional, Positive · **Priority:** P0 · **Platform:** Both
**Preconditions:** Signed out; fresh email; Online.
**Steps:**
1. Fill First/Last name, a valid DOB (age ≥ 13), a valid email, matching password ≥ 8, and
   check the Terms/Privacy agreement.
2. Submit → land on VerifySignup.
3. Enter the 6-digit emailed code.
**Expected Result:** `requestSignup` navigates to VerifySignup with `{verificationGuid,email}`;
entering the correct code creates the account, sets a session, and lands on Home.

---

### JLM-SGNP-002 — Names required
**Category:** Negative, Boundary · **Priority:** P1 · **Platform:** Both
**Preconditions:** On Sign Up.
**Steps:**
1. Leave First and/or Last name empty and try to submit.
**Expected Result:** Submission blocked; validation requires both names non-empty.

---

### JLM-SGNP-003 — Email format validation
**Category:** Negative · **Priority:** P1 · **Platform:** Both
**Preconditions:** On Sign Up.
**Steps:**
1. Enter `abc`, `abc@`, `abc@x`, then a valid `a@b.co`.
**Expected Result:** Invalid formats are rejected by the email regex; only a well-formed
email allows submission.

---

### JLM-SGNP-004 — Password minimum length (boundary)
**Category:** Boundary, Negative · **Priority:** P0 · **Platform:** Both
**Preconditions:** On Sign Up.
**Steps:**
1. Enter a 7-char password (+matching confirm) and submit; then 8 chars.
**Expected Result:** 7 chars rejected; 8 chars accepted (min valid length).

---

### JLM-SGNP-005 — Password/confirm mismatch shows inline error
**Category:** Negative · **Priority:** P0 · **Platform:** Both
**Preconditions:** On Sign Up.
**Steps:**
1. Enter password and a different confirm value.
**Expected Result:** Inline mismatch error; submission blocked until they match.

---

### JLM-SGNP-006 — Terms/Privacy agreement required
**Category:** Negative, Functional · **Priority:** P1 · **Platform:** Both
**Preconditions:** On Sign Up with all other fields valid.
**Steps:**
1. Leave the agreement checkbox unchecked and submit.
**Expected Result:** Blocked until checked. Tapping the inline Terms/Privacy links opens
TermsOfUse / PrivacyPolicy and returns without losing form state.

---

### JLM-SGNP-007 — DateField wheel opens and greys invalid days
**Category:** UI/UX, Boundary · **Priority:** P1 · **Platform:** Both
**Preconditions:** On Sign Up.
**Steps:**
1. Open the DateField; set month = February; scroll days to 30/31.
**Expected Result:** A JS day/month/year wheel modal opens; invalid days (e.g. Feb 30) are
greyed/disabled; selectable year range corresponds to ages 13–100.

---

### JLM-SGNP-008 — Age boundary: under 13 rejected, exactly 13 accepted
**Category:** Boundary, Negative · **Priority:** P0 · **Platform:** Both
**Preconditions:** On Sign Up.
**Steps:**
1. Set DOB giving age 12; observe. Set DOB giving age exactly 13.
**Expected Result:** Age 12 shows an inline age error and blocks submit; age 13 is accepted.

---

### JLM-SGNP-009 — Age upper boundary (100/101)
**Category:** Boundary · **Priority:** P2 · **Platform:** Both
**Preconditions:** On Sign Up.
**Steps:**
1. Attempt to select a DOB implying age 101 vs 100.
**Expected Result:** The wheel does not allow ages beyond 100 (year range bounded); 100 is
selectable.

---

### JLM-SGNP-010 — Duplicate email handled
**Category:** Negative, Integration · **Priority:** P1 · **Platform:** Both
**Preconditions:** Email already registered.
**Steps:**
1. Submit sign-up with an existing account's email.
**Expected Result:** A notice/error is shown; user is not navigated to verification with a
misleading state.

---

### JLM-SGNP-011 — Verify screen shows the target email
**Category:** UI/UX · **Priority:** P2 · **Platform:** Both
**Preconditions:** Just completed phase 1.
**Steps:**
1. Observe the VerifySignup subtitle.
**Expected Result:** The email the code was sent to is displayed.

---

### JLM-SGNP-012 — OTP auto-submits when 6 digits entered
**Category:** Functional, Positive · **Priority:** P1 · **Platform:** Both
**Preconditions:** On VerifySignup.
**Steps:**
1. Enter all 6 digits.
**Expected Result:** The 6-cell OtpInput auto-submits on completion (no separate button tap
needed); spinner shows while verifying.

---

### JLM-SGNP-013 — Wrong OTP shows error and allows retry
**Category:** Negative · **Priority:** P0 · **Platform:** Both
**Preconditions:** On VerifySignup.
**Steps:**
1. Enter an incorrect 6-digit code.
**Expected Result:** Inline error; user can clear and re-enter; no account created.

---

### JLM-SGNP-014 — Resend cooldown (60s)
**Category:** Boundary, Functional · **Priority:** P1 · **Platform:** Both
**Preconditions:** On VerifySignup.
**Steps:**
1. Tap Resend; observe the countdown; try tapping again during cooldown; wait to 0 and tap.
**Expected Result:** Resend disabled with a 60s countdown; ignored while counting; re-enabled
at 0s and a new code is sent (`resendSignup`).

---

### JLM-SGNP-015 — Back from Verify returns to Sign Up
**Category:** Functional · **Priority:** P2 · **Platform:** Both
**Preconditions:** On VerifySignup.
**Steps:**
1. Tap the back arrow.
**Expected Result:** Returns to Sign Up; re-submitting starts a fresh phase-1 request.

---

### JLM-SGNP-016 — Verify timeout not double-charged
**Category:** Integration, Regression · **Priority:** P2 · **Platform:** Both
**Preconditions:** Simulate a timeout on `/verify-signup`.
**Steps:**
1. Submit a valid code on a stalled connection.
**Expected Result:** Timeout (`ECONNABORTED`) is not auto-retried (single-use OTP protection);
an error is shown and the user may resend/retry manually.
