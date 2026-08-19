import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  autofillOff,
  authTextStyles as T,
  FloatingField,
  GoldButton,
  TurnstileWidget,
} from '@/components/auth';
import { CONFIG } from '@/constants';

interface EmailPhaseProps {
  email: string;
  onEmailChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  onTurnstileToken: (token: string) => void;
  onTurnstileError: () => void;
}

/**
 * Screen 1 — the one door. Collects the email only; the lookup at the Jubilee
 * Account authority decides which of the three outcomes follows.
 *
 * Turnstile lives here and only here, and is deliberately fail-safe: if the
 * widget can't render, the parent's `tnFailed` flag lets the submit through
 * rather than stranding the user behind a captcha that will never appear.
 */
export const EmailPhase: React.FC<EmailPhaseProps> = ({
  email,
  onEmailChange,
  onSubmit,
  busy,
  onTurnstileToken,
  onTurnstileError,
}) => {
  const { t } = useTranslation();

  return (
    <View>
      <Text style={T.title}>{t('auth.email.title')}</Text>
      <Text style={T.subtitle}>{t('auth.email.subtitle')}</Text>

      <FloatingField
        // The captcha sits right under this field, so it gets less bottom margin
        // than a normal field. Only when a captcha is actually rendered.
        style={CONFIG.TURNSTILE_SITE_KEY ? styles.fieldTight : undefined}
        label={t('auth.email.field')}
        placeholder={t('auth.email.placeholder')}
        value={email}
        onChangeText={onEmailChange}
        // No autoFocus: this is the first thing shown after the splash, and
        // grabbing focus there throws the keyboard up over the screen before
        // the user has looked at it. They tap the field when they're ready.
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={onSubmit}
        {...autofillOff}
      />

      {CONFIG.TURNSTILE_SITE_KEY ? (
        <TurnstileWidget
          style={styles.captcha}
          onToken={onTurnstileToken}
          onError={onTurnstileError}
        />
      ) : null}

      <GoldButton
        label={busy ? t('auth.email.busy') : t('auth.email.submit')}
        busy={busy}
        onPress={onSubmit}
      />

      <Text style={[T.subtitle, styles.note]}>{t('auth.email.noAccount')}</Text>
    </View>
  );
};

/**
 * Gap above and below the captcha. Tighter than the 18px between ordinary
 * fields, since the captcha's own centring adds a couple of px on each side.
 */
const CAPTCHA_GAP = 12;
/** GoldButton carries its own 6px top margin, so only the remainder is needed. */
const GOLD_BUTTON_MARGIN_TOP = 6;

const styles = StyleSheet.create({
  fieldTight: { marginBottom: CAPTCHA_GAP },
  captcha: { marginBottom: CAPTCHA_GAP - GOLD_BUTTON_MARGIN_TOP },
  note: { marginTop: 16, marginBottom: 0, fontSize: 12.5 },
});
