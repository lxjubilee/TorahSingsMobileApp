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
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AppText, BrandLogo, IconButton } from '@/components/common';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { verify2FA, clearAuthError } from '@/redux';

// Gold, matching theme.colors.accent (see theme/colors).
const ACCENT = '#ffd877';
// Gold is light — white on it is ~1.4:1 and unreadable, so filled
// accent surfaces use this instead.
const ON_ACCENT = '#0B0B0F';

/**
 * 2FA challenge: enter the OTP code issued by the backend. `verificationGuid`
 * comes from the slice's `pending2FA` (set during sign-in). On success the slice
 * flips to authenticated and the app gate swaps to the main navigator.
 */
export const TwoFactorScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const status = useAppSelector((s) => s.auth.status);
  const error = useAppSelector((s) => s.auth.error);
  const pending2FA = useAppSelector((s) => s.auth.pending2FA);

  const [code, setCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(true);

  const loading = status === 'loading';
  const canSubmit = code.trim().length >= 4 && !loading && !!pending2FA;

  const onVerify = () => {
    if (!canSubmit || !pending2FA) return;
    // email + verificationGuid come from the slice's pending2FA (set at sign-in).
    void dispatch(verify2FA({ code, trustDevice }));
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
            <AppText style={styles.title}>{t('auth.twoFactor.title')}</AppText>
            <AppText variant="body" color="textSecondary" style={styles.subtitle}>
              {t('auth.twoFactor.subtitle')}
            </AppText>

            <TextInput
              value={code}
              onChangeText={(v) => {
                setCode(v.replace(/[^0-9]/g, ''));
                if (error) dispatch(clearAuthError());
              }}
              placeholder={t('auth.twoFactor.codePlaceholder')}
              placeholderTextColor="#8A8A99"
              keyboardType="number-pad"
              maxLength={6}
              onSubmitEditing={onVerify}
              style={styles.input}
            />

            <Pressable style={styles.trustRow} onPress={() => setTrustDevice((v) => !v)}>
              <Ionicons
                name={trustDevice ? 'checkbox' : 'square-outline'}
                size={22}
                color={trustDevice ? ACCENT : '#8A8A99'}
              />
              <AppText variant="body" style={styles.trustLabel}>
                {t('auth.twoFactor.trustDevice')}
              </AppText>
            </Pressable>

            {error ? (
              <AppText variant="bodySm" color="danger" style={styles.error}>
                {error}
              </AppText>
            ) : null}

            <Pressable
              onPress={onVerify}
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
                  {t('auth.twoFactor.submit')}
                </AppText>
              )}
            </Pressable>
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
    fontSize: 18,
    letterSpacing: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  trustLabel: { color: '#FFFFFF' },
  error: { marginTop: 14 },
  cta: {
    marginTop: 20,
    backgroundColor: ACCENT,
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { color: ON_ACCENT, fontWeight: '700' },
});

export default TwoFactorScreen;
