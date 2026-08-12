import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  ActionsRow,
  authPalette as C,
  authTextStyles as T,
  GoldButton,
  LinkButton,
  useAuthScroll,
} from '@/components/auth';
import { OtpInput } from '@/components/common';

/** Boxes are gold-on-brown here rather than the app's default white-on-black. */
const OTP_TINT = {
  border: C.fieldBorder,
  borderFilled: C.fieldBorderFocus,
  borderFocused: C.fieldBorderFocus,
  background: 'transparent',
  text: '#fff',
};

interface CodePhaseProps {
  email: string;
  code: string;
  onCodeChange: (v: string) => void;
  onSubmit: (code?: string) => void;
  /** `login` completes a 2FA challenge; `signup` finishes creating the account. */
  mode: 'login' | 'signup';
  cooldown: number;
  /** Too many bad attempts — submit and resend are both dead until they retry later. */
  locked: boolean;
  onResend: () => void;
  onEdit: () => void;
  busy: boolean;
}

/**
 * The emailed 6-digit code, shared by both challenges: a login 2FA (local-mode
 * APIs still issue these) and the final step of creating a new Jubilee Account.
 *
 * Unlike the web's single `<input maxLength=6>` this uses the app's segmented
 * `OtpInput`, which gets SMS autofill and auto-submits on the sixth digit —
 * strictly better on a phone, and already built.
 */
export const CodePhase: React.FC<CodePhaseProps> = ({
  email,
  code,
  onCodeChange,
  onSubmit,
  mode,
  cooldown,
  locked,
  onResend,
  onEdit,
  busy,
}) => {
  const { t } = useTranslation();
  const boxesRef = useRef<View>(null);
  const { onFieldFocus } = useAuthScroll();

  return (
    <View>
      <Text style={T.title}>{t('auth.code.title')}</Text>
      <Text style={T.subtitle}>
        {t('auth.code.subtitlePrefix')}
        <Text style={styles.email}>{email}</Text>
        {t('auth.code.subtitleSuffix')}
      </Text>

      <Text style={styles.label}>{t('auth.code.field')}</Text>
      {/* collapsable={false}: an unstyled View is dropped from Android's native
          tree and can't be measured for the keyboard scroll. */}
      <View ref={boxesRef} collapsable={false}>
        <OtpInput
          value={code}
          onChange={onCodeChange}
          tint={OTP_TINT}
          onFocus={() => onFieldFocus(boxesRef.current)}
          // Auto-submit the moment the sixth digit lands (or is autofilled).
          onComplete={(full) => {
            if (!locked && !busy) onSubmit(full);
          }}
        />
      </View>

      <GoldButton
        style={styles.cta}
        label={
          busy
            ? t('auth.code.busy')
            : mode === 'login'
              ? t('auth.code.submitLogin')
              : t('auth.code.submitSignup')
        }
        busy={busy}
        disabled={locked || code.length !== 6}
        onPress={() => onSubmit()}
      />

      <ActionsRow>
        <LinkButton
          label={cooldown > 0 ? t('auth.code.resendIn', { seconds: cooldown }) : t('auth.code.resend')}
          onPress={onResend}
          disabled={cooldown > 0 || locked}
        />
        <LinkButton
          label={mode === 'login' ? t('auth.code.editLogin') : t('auth.code.editSignup')}
          onPress={onEdit}
        />
      </ActionsRow>
    </View>
  );
};

const styles = StyleSheet.create({
  email: { color: C.emphasis, fontWeight: '700' },
  label: { fontSize: 12, color: C.label, marginBottom: 8 },
  cta: { marginTop: 18 },
});
