import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  AccountRow,
  autofillOff,
  authTextStyles as T,
  CheckboxRow,
  FloatingField,
  ForgotRow,
  GoldButton,
} from '@/components/auth';

interface PasswordPhaseProps {
  title: string;
  /** Only the "Confirm it's you" variant has one. */
  subtitle?: string;
  passwordLabel: string;
  email: string;
  password: string;
  onPasswordChange: (v: string) => void;
  onSubmit: () => void;
  onChangeEmail: () => void;
  onForgot: () => void;
  busy: boolean;
  submitLabel: string;
  busyLabel: string;
  /** "Keep me signed in" is offered on the returning-member screen only. */
  rememberMe?: { value: boolean; onToggle: () => void };
}

/**
 * Screens 2A ("Welcome back") and 2B-1 ("Confirm it's you"). Both are the same
 * shape — account row, one password field, a forgot link and a CTA — so they
 * share a component and differ only in copy and whether the remember-me box is
 * offered. Which one renders is decided by the lookup: a local Torah Sings row
 * means 2A, a Jubilee Account with no local row means 2B-1.
 */
export const PasswordPhase: React.FC<PasswordPhaseProps> = ({
  title,
  subtitle,
  passwordLabel,
  email,
  password,
  onPasswordChange,
  onSubmit,
  onChangeEmail,
  onForgot,
  busy,
  submitLabel,
  busyLabel,
  rememberMe,
}) => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  return (
    <View>
      <Text style={T.title}>{title}</Text>
      {subtitle ? <Text style={T.subtitle}>{subtitle}</Text> : null}

      <AccountRow email={email} onChangeEmail={onChangeEmail} />

      <FloatingField
        label={passwordLabel}
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry={!show}
        autoFocus
        autoCapitalize="none"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        {...autofillOff}
        adornment={show ? 'eye-off-outline' : 'eye-outline'}
        onAdornmentPress={() => setShow((v) => !v)}
        adornmentLabel={show ? t('auth.common.hidePassword') : t('auth.common.showPassword')}
      />

      <ForgotRow onPress={onForgot} />

      {rememberMe ? (
        <CheckboxRow
          checked={rememberMe.value}
          onToggle={rememberMe.onToggle}
          accessibilityLabel={t('auth.common.keepSignedIn')}
        >
          {t('auth.common.keepSignedIn')}
        </CheckboxRow>
      ) : null}

      <GoldButton label={busy ? busyLabel : submitLabel} busy={busy} onPress={onSubmit} />
    </View>
  );
};
