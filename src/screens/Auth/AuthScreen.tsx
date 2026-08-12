import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ageFromDob, AuthShell, MIN_AGE } from '@/components/auth';
import { useAppDispatch } from '@/hooks';
import { clearAuthError, requestSignup, resendSignup, signIn, verifySignup } from '@/redux';
import type { AuthRejection } from '@/redux';
import { authService } from '@/services/auth';
import type { ApiError } from '@/services/api';
import { CONFIG } from '@/constants';
import { logger } from '@/utils';
import type { AuthStackParamList } from '@/navigation/types';
import { EmailPhase } from './phases/EmailPhase';
import { PasswordPhase } from './phases/PasswordPhase';
import { CreateLinkedPhase } from './phases/CreateLinkedPhase';
import { NewAccountPhase } from './phases/NewAccountPhase';
import { CodePhase } from './phases/CodePhase';

const SITE_NAME = 'Torah Sings';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const RESEND_COOLDOWN_S = 60;
/** How long to wait for Turnstile before deciding it will never render. */
const TURNSTILE_GRACE_MS = 8000;

/**
 * The six phases of the "one door", mirroring the web's `SignInForm`:
 *   email        : the only entry point — look the address up, then route
 *   welcome      : returning Torah Sings member → password → sign in
 *   confirm      : has a Jubilee Account, new here → confirm password …
 *   createlinked : … then create the local account (First/Last/DOB, no password)
 *   new          : no Jubilee Account → create one → 6-digit email verification
 *   code         : the emailed OTP, for either a new signup or a login 2FA
 */
type Phase = 'email' | 'welcome' | 'confirm' | 'createlinked' | 'new' | 'code';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Auth'>;

/**
 * Auth thunks reject with an `AuthRejection`; `authService` calls made directly
 * (the lookup, the 2FA resend) throw a raw `ApiError`. Both carry the same three
 * facts, so these readers accept either.
 */
const errText = (e: unknown, fallback: string): string => {
  const msg = (e as AuthRejection | ApiError)?.message ?? (e as Error)?.message;
  return typeof msg === 'string' && msg.length > 0 ? msg : fallback;
};

const statusOf = (e: unknown): number => (e as AuthRejection | ApiError)?.status ?? 0;

const bodyOf = (e: unknown): Record<string, unknown> =>
  (e as AuthRejection)?.body ?? ((e as ApiError)?.raw as Record<string, unknown>) ?? {};

/**
 * The email-first "one door" (Jubilee Account). A single screen holding every
 * phase, exactly like the web: the password typed on `confirm` has to survive
 * into `createlinked` (the provision call re-sends it), so the phases share one
 * component's state rather than travelling through navigation params.
 */
export const AuthScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();

  const [phase, setPhase] = useState<Phase>('email');

  const [email, setEmail] = useState('');
  // The Jubilee Account password on welcome/confirm, or the new one on `new`.
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [agree, setAgree] = useState(false);

  // OTP — a new-account signup code OR a login 2FA code.
  const [codeMode, setCodeMode] = useState<'login' | 'signup'>('signup');
  const [guid, setGuid] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [locked, setLocked] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Turnstile (email phase only). `tnFailed` is the fail-safe: if the widget
  // can't render we must let the submit through rather than block sign-in
  // behind a captcha that will never appear.
  const [tnToken, setTnToken] = useState('');
  const [tnFailed, setTnFailed] = useState(false);

  const busyRef = useRef(false);
  /** Guards every handler so a double-tap can't fire two requests. */
  const begin = (): boolean => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setErr(null);
    setInfo(null);
    return true;
  };
  const end = () => {
    busyRef.current = false;
    setBusy(false);
  };

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Turnstile grace period — after this the widget is presumed dead and the
  // email phase stops waiting on a token.
  useEffect(() => {
    if (phase !== 'email' || !CONFIG.TURNSTILE_SITE_KEY) return undefined;
    const id = setTimeout(() => setTnFailed(true), TURNSTILE_GRACE_MS);
    return () => clearTimeout(id);
  }, [phase]);

  // Leaving the email phase unmounts the widget, so stop waiting on it. The
  // token itself is KEPT: the lookup is a GET that never redeems it, so it's
  // still unused and gets forwarded on the first credential call. In SSO mode
  // the server ignores it; in local/JI mode that call would 400 without it.
  useEffect(() => {
    if (phase !== 'email') setTnFailed(false);
  }, [phase]);

  // A stale rejection from a previous visit shouldn't greet the next one.
  useFocusEffect(
    useCallback(() => {
      dispatch(clearAuthError());
    }, [dispatch]),
  );

  /** Back to Screen 1, dropping everything the address determined. */
  const useDifferentEmail = useCallback(() => {
    setPhase('email');
    setErr(null);
    setInfo(null);
    setPassword('');
    setConfirm('');
    setFirstName('');
    setLastName('');
    setDob(null);
    setGuid('');
    setCode('');
    setLocked(false);
  }, []);

  // Hardware back walks the phases backwards instead of leaving the flow.
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (phase === 'email') return false; // let the navigator handle it
        if (phase === 'code') {
          setPhase(codeMode === 'login' ? 'welcome' : 'new');
          setCode('');
          setLocked(false);
          setErr(null);
          setInfo(null);
          return true;
        }
        if (phase === 'createlinked') {
          setPhase('confirm');
          setErr(null);
          setInfo(null);
          return true;
        }
        useDifferentEmail();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [phase, codeMode, useDifferentEmail]),
  );

  const openTerms = () => navigation.navigate('TermsOfUse');
  const openPrivacy = () => navigation.navigate('PrivacyPolicy');
  const openForgot = () => navigation.navigate('ForgotPassword', { email: email.trim() });

  /** Moves to the OTP phase for either challenge. */
  const goToCode = (mode: 'login' | 'signup', verificationGuid: string) => {
    setCodeMode(mode);
    setGuid(verificationGuid);
    setCode('');
    setLocked(false);
    setPhase('code');
    setCooldown(RESEND_COOLDOWN_S);
    setInfo(t(mode === 'login' ? 'auth.info.codeSentLogin' : 'auth.info.codeSentSignup'));
  };

  /** Pre-fills the create form from whatever the authority holds. */
  const goToCreateLinked = (profile: {
    first_name?: string;
    last_name?: string;
    date_of_birth?: string | null;
  }) => {
    setFirstName(profile.first_name ?? '');
    setLastName(profile.last_name ?? '');
    setDob(profile.date_of_birth ? String(profile.date_of_birth).slice(0, 10) : null);
    setPhase('createlinked');
  };

  // ---- Screen 1: email → look up the Jubilee Account, then route ----
  async function submitEmail() {
    const addr = email.trim();
    if (!EMAIL_RE.test(addr)) {
      setErr(t('auth.errors.invalidEmail'));
      return;
    }
    if (CONFIG.TURNSTILE_SITE_KEY && !tnToken && !tnFailed) {
      setErr(t('auth.errors.turnstile'));
      return;
    }
    if (!begin()) return;
    try {
      const look = await authService.lookupEmail(addr);
      if (look?.existsLocally) setPhase('welcome'); // Outcome A — returning member
      else if (look?.existsInSso) setPhase('confirm'); // Outcome B — Jubilee Account, new here
      else setPhase('new'); // Outcome C — brand new
    } catch (e) {
      // Fail open to full sign-up; a genuine collision is caught at create time.
      logger.warn('AUTH lookup failed — falling through to sign-up', e);
      setPhase('new');
    } finally {
      end();
    }
  }

  // ---- Screen 2A: returning member → verify password → sign in ----
  async function submitWelcome() {
    if (!password) {
      setErr(t('auth.errors.noPassword'));
      return;
    }
    if (!begin()) return;
    try {
      const res = await dispatch(
        signIn({
          email: email.trim(),
          password,
          rememberMe,
          cfTurnstileToken: tnToken || undefined,
        }),
      ).unwrap();
      if (res.kind === '2fa') {
        goToCode('login', res.verificationGuid);
      } else if (res.kind === 'needsProfile') {
        // Defensive: no local account after all → create it.
        goToCreateLinked(res.profile);
      } else if (res.kind === 'redirectSignup') {
        setPhase('new');
      }
      // `authenticated` needs nothing here — the slice flips App's auth gate.
    } catch (e) {
      setErr(errText(e, t('auth.errors.badPassword')));
    } finally {
      end();
    }
  }

  // ---- Screen 2B-1: existing Jubilee Account, new here → confirm password ----
  async function submitConfirm() {
    if (!password) {
      setErr(t('auth.errors.noPassword'));
      return;
    }
    if (!begin()) return;
    try {
      const res = await dispatch(
        signIn({
          email: email.trim(),
          password,
          rememberMe,
          preview: true,
          cfTurnstileToken: tnToken || undefined,
        }),
      ).unwrap();
      if (res.kind === 'needsProfile') goToCreateLinked(res.profile);
      else if (res.kind === '2fa') goToCode('login', res.verificationGuid);
      else if (res.kind === 'redirectSignup') setPhase('new');
      // `authenticated` is the edge where a local account existed after all.
    } catch (e) {
      setErr(errText(e, t('auth.errors.badPassword')));
    } finally {
      end();
    }
  }

  // ---- Screen 2B-2: create the linked account (no password; edits sync to the SSO) ----
  async function submitCreateLinked() {
    if (!firstName.trim() || !lastName.trim()) {
      setErr(t('auth.errors.noName'));
      return;
    }
    if (!begin()) return;
    try {
      await dispatch(
        signIn({
          email: email.trim(),
          password,
          rememberMe,
          provision: true,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dob ?? undefined,
        }),
      ).unwrap();
    } catch (e) {
      setErr(errText(e, t('auth.errors.createFailed')));
    } finally {
      end();
    }
  }

  // ---- Screen 2C: create a brand-new Jubilee Account → email a code ----
  async function submitNew() {
    if (!firstName.trim() || !lastName.trim()) {
      setErr(t('auth.errors.noName'));
      return;
    }
    if (password !== confirm) {
      setErr(t('auth.errors.mismatch'));
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setErr(t('auth.errors.shortPassword'));
      return;
    }
    if (!dob) {
      setErr(t('auth.errors.noDob'));
      return;
    }
    const age = ageFromDob(dob);
    if (Number.isNaN(age)) {
      setErr(t('auth.errors.noDob'));
      return;
    }
    if (age < MIN_AGE) {
      setErr(t('auth.errors.minAge', { age: MIN_AGE }));
      return;
    }
    if (!agree) {
      setErr(t('auth.errors.noAgree'));
      return;
    }
    if (!begin()) return;
    try {
      const res = await dispatch(
        requestSignup({
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          email: email.trim(),
          password,
        }),
      ).unwrap();
      goToCode('signup', res.verificationGuid);
    } catch (e) {
      setErr(errText(e, t('auth.errors.unreachable')));
    } finally {
      end();
    }
  }

  // ---- OTP step: verify the code ----
  async function submitCode(submitted?: string) {
    const value = submitted ?? code;
    if (value.length !== 6 || locked) return;
    if (!begin()) return;
    try {
      if (codeMode === 'login') {
        await dispatch(
          signIn({
            email: email.trim(),
            password,
            rememberMe,
            verificationGuid: guid,
            verificationCode: value,
          }),
        ).unwrap();
      } else {
        await dispatch(
          verifySignup({ verificationGuid: guid, verificationCode: value }),
        ).unwrap();
      }
    } catch (e) {
      const status = statusOf(e);
      const body = bodyOf(e);
      if (status === 423 || body.locked === true) setLocked(true);
      // The stashed signup was consumed or throttled away — the guid is dead, so
      // send them back to re-enter their details rather than retry a dud code.
      if ((status === 429 || status === 409) && codeMode === 'signup') {
        setPhase('new');
        setGuid('');
        setCode('');
      }
      setErr(errText(e, t('auth.errors.verifyFailed')));
    } finally {
      end();
    }
  }

  async function resend() {
    if (cooldown > 0 || locked || busyRef.current) return;
    setErr(null);
    setInfo(null);
    try {
      const res =
        codeMode === 'login'
          ? await authService.resendLogin(email.trim(), guid)
          : await dispatch(resendSignup(guid)).unwrap();
      setCooldown(RESEND_COOLDOWN_S);
      const left = res?.resendsRemaining;
      setInfo(
        typeof left === 'number'
          ? t('auth.info.resentWithCount', { count: left })
          : t('auth.info.resent'),
      );
    } catch (e) {
      const status = statusOf(e);
      const body = bodyOf(e);
      if (status === 423 || body.locked === true) setLocked(true);
      else if (status === 429 && typeof body.cooldownSeconds === 'number') {
        setCooldown(body.cooldownSeconds);
      } else if (body.exhausted === true && codeMode === 'signup') {
        setPhase('new');
        setGuid('');
        setCode('');
      }
      setErr(errText(e, t('auth.errors.resendFailed')));
    }
  }

  return (
    <AuthShell info={info} error={err} onOpenTerms={openTerms} onOpenPrivacy={openPrivacy}>
      {phase === 'email' && (
        <EmailPhase
          email={email}
          onEmailChange={setEmail}
          onSubmit={submitEmail}
          busy={busy}
          onTurnstileToken={(token) => {
            setTnToken(token);
            setTnFailed(false);
          }}
          onTurnstileError={() => {
            setTnToken('');
            setTnFailed(true);
          }}
        />
      )}

      {phase === 'welcome' && (
        <PasswordPhase
          title={t('auth.welcome.title')}
          passwordLabel={t('auth.welcome.password')}
          email={email}
          password={password}
          onPasswordChange={setPassword}
          onSubmit={submitWelcome}
          onChangeEmail={useDifferentEmail}
          onForgot={openForgot}
          busy={busy}
          submitLabel={t('auth.welcome.submit')}
          busyLabel={t('auth.welcome.busy')}
          rememberMe={{ value: rememberMe, onToggle: () => setRememberMe((v) => !v) }}
        />
      )}

      {phase === 'confirm' && (
        <PasswordPhase
          title={t('auth.confirm.title')}
          subtitle={t('auth.confirm.subtitle', { site: SITE_NAME })}
          passwordLabel={t('auth.confirm.password')}
          email={email}
          password={password}
          onPasswordChange={setPassword}
          onSubmit={submitConfirm}
          onChangeEmail={useDifferentEmail}
          onForgot={openForgot}
          busy={busy}
          submitLabel={t('auth.confirm.submit')}
          busyLabel={t('auth.confirm.busy')}
        />
      )}

      {phase === 'createlinked' && (
        <CreateLinkedPhase
          firstName={firstName}
          lastName={lastName}
          dob={dob}
          rememberMe={rememberMe}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          onDobChange={setDob}
          onToggleRemember={() => setRememberMe((v) => !v)}
          onSubmit={submitCreateLinked}
          onChangeEmail={useDifferentEmail}
          busy={busy}
        />
      )}

      {phase === 'new' && (
        <NewAccountPhase
          email={email}
          firstName={firstName}
          lastName={lastName}
          dob={dob}
          password={password}
          confirm={confirm}
          rememberMe={rememberMe}
          agree={agree}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          onDobChange={setDob}
          onPasswordChange={setPassword}
          onConfirmChange={setConfirm}
          onToggleRemember={() => setRememberMe((v) => !v)}
          onToggleAgree={() => setAgree((v) => !v)}
          onSubmit={submitNew}
          onChangeEmail={useDifferentEmail}
          onOpenTerms={openTerms}
          onOpenPrivacy={openPrivacy}
          busy={busy}
        />
      )}

      {phase === 'code' && (
        <CodePhase
          email={email}
          code={code}
          onCodeChange={setCode}
          onSubmit={submitCode}
          mode={codeMode}
          cooldown={cooldown}
          locked={locked}
          onResend={resend}
          onEdit={() => {
            setPhase(codeMode === 'login' ? 'welcome' : 'new');
            setCode('');
            setLocked(false);
            setErr(null);
            setInfo(null);
          }}
          busy={busy}
        />
      )}
    </AuthShell>
  );
};
