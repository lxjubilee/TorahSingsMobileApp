import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppText, BrandLogo, IconButton, PasswordInput } from '@/components/common';
import { TurnstileWidget } from '@/components/auth/TurnstileWidget';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { signIn, clearAuthError } from '@/redux';
import { CONFIG } from '@/constants';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignIn'>;
// Gold, matching theme.colors.accent (see theme/colors).
const ACCENT = '#ffd877';
// Gold is light — white on it is ~1.4:1 and unreadable, so filled
// accent surfaces use this instead.
const ON_ACCENT = '#0B0B0F';

/**
 * "Ready to listen?" — real email + password sign-in against the SSO backend.
 * On a 2FA challenge the slice sets `pending2FA`; we route to the TwoFactor
 * screen. Errors surface inline from `auth.error`.
 */
export const SignInScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const status = useAppSelector((s) => s.auth.status);
  const error = useAppSelector((s) => s.auth.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  // Drop any error left over from another auth screen (e.g. a failed signup)
  // so it doesn't surface here when this screen gains focus.
  useFocusEffect(
    useCallback(() => {
      dispatch(clearAuthError());
    }, [dispatch]),
  );

  // Cloudflare Turnstile: gate sign-in on a CAPTCHA token when a site key is set.
  const captchaRequired = !!CONFIG.TURNSTILE_SITE_KEY;
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0); // bump to remount the widget for a fresh token
  const refreshCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaKey((k) => k + 1);
  };

  const loading = status === 'loading';
  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    !loading &&
    (!captchaRequired || !!captchaToken);

  const onSubmit = async () => {
    if (!canSubmit) return;
    const result = await dispatch(
      signIn({ email, password, rememberMe: true, cfTurnstileToken: captchaToken ?? undefined }),
    );
    if (signIn.fulfilled.match(result)) {
      // If the backend asked for 2FA, the slice populated pending2FA → go verify.
      if (result.payload.kind === '2fa') navigation.navigate('TwoFactor');
    } else if (captchaRequired) {
      // The token is single-use; get a fresh one for the next attempt.
      refreshCaptcha();
    }
  };

  const onBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Welcome'); // Sign In is the stack root → go to Get Started
  };

  const borderFor = (field: 'email' | 'password') =>
    focused === field ? '#FFFFFF' : 'rgba(255,255,255,0.45)';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <IconButton name="arrow-back" size={26} onPress={onBack} />
          <BrandLogo textStyle={styles.logo} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AppText style={styles.title}>{t('auth.signin.title')}</AppText>
            <AppText variant="body" color="textSecondary" style={styles.subtitle}>
              {t('auth.signin.subtitle')}
            </AppText>

            <TextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) dispatch(clearAuthError());
              }}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              placeholder={t('auth.signin.email')}
              placeholderTextColor="#8A8A99"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { borderColor: borderFor('email') }]}
            />

            <PasswordInput
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (error) dispatch(clearAuthError());
              }}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              placeholder={t('auth.signin.password')}
              onSubmitEditing={onSubmit}
              returnKeyType="go"
              containerStyle={[styles.inputSpaced, { borderColor: borderFor('password') }]}
            />

            {error ? (
              <AppText variant="bodySm" color="danger" style={styles.error}>
                {error}
              </AppText>
            ) : null}

            {captchaRequired ? (
              <TurnstileWidget
                key={captchaKey}
                onToken={setCaptchaToken}
                onError={() => setCaptchaToken(null)}
              />
            ) : null}

            <Pressable
              onPress={onSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.cta,
                { opacity: !canSubmit ? 0.6 : pressed ? 0.85 : 1 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <AppText variant="h3" style={styles.ctaLabel}>
                  {t('auth.signin.submit')}
                </AppText>
              )}
            </Pressable>

            <Pressable
              style={styles.help}
              hitSlop={6}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <AppText variant="h3" style={styles.helpText}>
                {t('auth.signin.forgot')}
              </AppText>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </Pressable>

            <View style={styles.signupRow}>
              <AppText variant="body" color="textMuted">
                {t('auth.signin.newPrompt')}
              </AppText>
              <Pressable hitSlop={6} onPress={() => navigation.navigate('SignUp')}>
                <AppText variant="body" style={styles.signupLink}>
                  {t('auth.signin.signUp')}
                </AppText>
              </Pressable>
            </View>

            <AppText variant="bodySm" color="textMuted" style={styles.recaptcha}>
              {t('auth.signin.botNotice')}
            </AppText>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0F' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 6,
  },
  logo: { color: ACCENT, fontSize: 20, lineHeight: 26, fontWeight: '900', letterSpacing: 1 },
  content: { paddingHorizontal: 22, paddingTop: 18 },
  title: { color: '#FFFFFF', fontSize: 28, lineHeight: 36, fontWeight: '800' },
  subtitle: { marginTop: 12, fontSize: 16, lineHeight: 22 },
  input: {
    marginTop: 26,
    height: 56,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  inputSpaced: { marginTop: 14 },
  error: { marginTop: 14 },
  cta: {
    marginTop: 18,
    backgroundColor: ACCENT,
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { color: ON_ACCENT, fontWeight: '700' },
  help: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 26 },
  helpText: { color: '#FFFFFF' },
  signupRow: { flexDirection: 'row', alignItems: 'center', marginTop: 26 },
  signupLink: { color: '#FFFFFF', fontWeight: '700' },
  recaptcha: { marginTop: 24, lineHeight: 18 },
});

export default SignInScreen;
