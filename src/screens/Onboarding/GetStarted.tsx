import React, { useState } from 'react';
import {
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
import { AppText, BrandLogo, IconButton } from '@/components/common';
import { useTranslation } from 'react-i18next';

interface GetStartedProps {
  onBack: () => void;
  /** Proceed into the app (sign-in/account is stubbed this pass). */
  onContinue: () => void;
}

// Gold, matching theme.colors.accent (see theme/colors).
const ACCENT = '#ffd877';
// Gold is light — white on it is unreadable, so filled buttons use this.
const ON_ACCENT = '#0B0B0F';

/**
 * "Ready to listen?" sign-in / get-started screen (Netflix style): back arrow +
 * red wordmark, headline + supporting copy, an email/mobile field, a red
 * Continue button, a Get Help disclosure, and the reCAPTCHA footnote.
 */
export const GetStarted: React.FC<GetStartedProps> = ({ onBack, onContinue }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header: back + wordmark. */}
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
              Enter your information to sign in or get started with a new account.
            </AppText>

            <TextInput
              value={value}
              onChangeText={setValue}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={t('onboarding.emailOrMobile')}
              placeholderTextColor="#8A8A99"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { borderColor: focused ? '#FFFFFF' : 'rgba(255,255,255,0.45)' }]}
            />

            <Pressable
              onPress={onContinue}
              style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
            >
              <AppText variant="h3" style={styles.ctaLabel}>
                {t('onboarding.continue')}
              </AppText>
            </Pressable>

            <Pressable style={styles.help} hitSlop={6}>
              <AppText variant="h3" style={styles.helpText}>
                {t('onboarding.getHelp')}
              </AppText>
              <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
            </Pressable>

            <AppText variant="bodySm" color="textMuted" style={styles.recaptcha}>
              This page is protected by Google reCAPTCHA to ensure you&apos;re not a bot.
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
  cta: {
    marginTop: 16,
    backgroundColor: ACCENT,
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { color: ON_ACCENT, fontWeight: '700' },
  help: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 28 },
  helpText: { color: '#FFFFFF' },
  recaptcha: { marginTop: 26, lineHeight: 18 },
});

export default GetStarted;
