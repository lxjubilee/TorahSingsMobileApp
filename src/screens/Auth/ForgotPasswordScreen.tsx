import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  ActionsRow,
  AuthShell,
  authTextStyles as T,
  FloatingField,
  GoldButton,
  LinkButton,
} from '@/components/auth';
import { useAppDispatch } from '@/hooks';
import { forgotPassword } from '@/redux';
import type { AuthRejection } from '@/redux';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = {
  goBack: () => void;
  navigate: (screen: 'TermsOfUse' | 'PrivacyPolicy') => void;
};

/**
 * Request a password-reset email. The API is anti-enumeration (identical
 * response whether or not the email exists), and the emailed link is redeemed on
 * the website — so this screen only sends the request and shows a neutral notice.
 *
 * Arrives from the one-door's password phases with the address pre-filled, and
 * wears the same panel so the jump doesn't change the look mid-flow.
 */
export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<AuthStackParamList, 'ForgotPassword'>>();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [email, setEmail] = useState(route.params?.email ?? '');
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
      setError((e as AuthRejection)?.message ?? t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      error={error}
      info={sent ? t('auth.forgot.sentMessage', { email: email.trim() }) : null}
      onOpenTerms={() => navigation.navigate('TermsOfUse')}
      onOpenPrivacy={() => navigation.navigate('PrivacyPolicy')}
    >
      <View>
        <Text style={T.title}>{t('auth.forgot.title')}</Text>

        {sent ? (
          <GoldButton label={t('auth.forgot.backToSignIn')} onPress={() => navigation.goBack()} />
        ) : (
          <>
            <Text style={T.subtitle}>{t('auth.forgot.instruction')}</Text>

            <FloatingField
              label={t('auth.forgot.email')}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) setError(null);
              }}
              autoFocus={!route.params?.email}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              returnKeyType="send"
              onSubmitEditing={onSubmit}
            />

            <GoldButton
              label={t('auth.forgot.submit')}
              busy={submitting}
              disabled={!emailValid}
              onPress={onSubmit}
            />

            <ActionsRow>
              <LinkButton
                label={t('auth.forgot.backToSignIn')}
                onPress={() => navigation.goBack()}
              />
            </ActionsRow>
          </>
        )}
      </View>
    </AuthShell>
  );
};

export default ForgotPasswordScreen;
