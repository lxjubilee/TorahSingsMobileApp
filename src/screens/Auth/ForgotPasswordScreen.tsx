import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AppText, BrandLogo, IconButton } from '@/components/common';
import { useAppDispatch } from '@/hooks';
import { forgotPassword } from '@/redux';

const ACCENT = '#007FFF'; // Azure blue accent

/**
 * Request a password-reset email. The API is anti-enumeration (identical
 * response whether or not the email exists), and the emailed link is redeemed on
 * the website — so this screen only sends the request and shows a neutral notice.
 */
export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const canSubmit = emailValid && !submitting && !sent;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await dispatch(forgotPassword(email)).unwrap();
      setSent(true);
    } catch (e) {
      setError(typeof e === 'string' ? e : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <IconButton name="arrow-back" size={26} onPress={() => navigation.goBack()} />
          <BrandLogo textStyle={styles.logo} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.content}>
            <AppText style={styles.title}>{t('auth.forgot.title')}</AppText>

            {sent ? (
              <>
                <AppText variant="body" color="textSecondary" style={styles.subtitle}>
                  {t('auth.forgot.sentMessage', { email: email.trim() })}
                </AppText>
                <Pressable
                  onPress={() => navigation.goBack()}
                  style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <AppText variant="h3" style={styles.ctaLabel}>
                    {t('auth.forgot.backToSignIn')}
                  </AppText>
                </Pressable>
              </>
            ) : (
              <>
                <AppText variant="body" color="textSecondary" style={styles.subtitle}>
                  {t('auth.forgot.instruction')}
                </AppText>

                <TextInput
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (error) setError(null);
                  }}
                  placeholder={t('auth.forgot.email')}
                  placeholderTextColor="#8A8A99"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={onSubmit}
                  returnKeyType="send"
                  style={styles.input}
                />

                {error ? (
                  <AppText variant="bodySm" color="danger" style={styles.error}>
                    {error}
                  </AppText>
                ) : null}

                <Pressable
                  onPress={onSubmit}
                  disabled={!canSubmit}
                  style={({ pressed }) => [
                    styles.cta,
                    { opacity: !canSubmit ? 0.6 : pressed ? 0.85 : 1 },
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <AppText variant="h3" style={styles.ctaLabel}>
                      {t('auth.forgot.submit')}
                    </AppText>
                  )}
                </Pressable>
              </>
            )}
          </View>
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
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 6,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  error: { marginTop: 14 },
  cta: {
    marginTop: 20,
    backgroundColor: ACCENT,
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { color: '#FFFFFF', fontWeight: '700' },
});

export default ForgotPasswordScreen;
