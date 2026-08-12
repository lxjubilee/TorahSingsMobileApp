import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  ActionsRow,
  authPalette as C,
  authTextStyles as T,
  CheckboxRow,
  DobField,
  FloatingField,
  floatingFieldStyles as F,
  GoldButton,
  LinkButton,
  PasswordStrengthMeter,
} from '@/components/auth';

const SITE_NAME = 'Torah Sings';

interface NewAccountPhaseProps {
  email: string;
  firstName: string;
  lastName: string;
  dob: string | null;
  password: string;
  confirm: string;
  rememberMe: boolean;
  agree: boolean;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onDobChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
  onToggleRemember: () => void;
  onToggleAgree: () => void;
  onSubmit: () => void;
  onChangeEmail: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  busy: boolean;
}

/**
 * Screen 2C — no Jubilee Account for this address, so create one. This is the
 * only phase that sets a password, because it's the only one that mints a new
 * credential at the authority. Ends in an emailed 6-digit code; the account is
 * not created until that code is verified.
 */
export const NewAccountPhase: React.FC<NewAccountPhaseProps> = ({
  email,
  firstName,
  lastName,
  dob,
  password,
  confirm,
  rememberMe,
  agree,
  onFirstNameChange,
  onLastNameChange,
  onDobChange,
  onPasswordChange,
  onConfirmChange,
  onToggleRemember,
  onToggleAgree,
  onSubmit,
  onChangeEmail,
  onOpenTerms,
  onOpenPrivacy,
  busy,
}) => {
  const { t } = useTranslation();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <View>
      <Text style={T.title}>{t('auth.new.title')}</Text>
      <Text style={T.subtitle}>{t('auth.new.subtitle', { site: SITE_NAME })}</Text>

      <View style={F.nameRow}>
        <FloatingField
          style={F.nameCol}
          label={t('auth.common.firstName')}
          value={firstName}
          onChangeText={onFirstNameChange}
          autoFocus
          autoCapitalize="words"
          textContentType="givenName"
          autoComplete="given-name"
        />
        <FloatingField
          style={F.nameCol}
          label={t('auth.common.lastName')}
          value={lastName}
          onChangeText={onLastNameChange}
          autoCapitalize="words"
          textContentType="familyName"
          autoComplete="family-name"
        />
      </View>

      <DobField label={t('auth.common.dob')} value={dob} onChange={onDobChange} />

      {/* Read-only: the address was settled on Screen 1, and changing it here
          would desync the lookup that routed us to this phase. */}
      <FloatingField label={t('auth.common.email')} value={email} editable={false} />

      <FloatingField
        label={t('auth.new.password')}
        placeholder="••••••••"
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry={!showPw}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
        adornment={showPw ? 'eye-off-outline' : 'eye-outline'}
        onAdornmentPress={() => setShowPw((v) => !v)}
        adornmentLabel={showPw ? t('auth.common.hidePassword') : t('auth.common.showPassword')}
      />
      <PasswordStrengthMeter password={password} />

      <FloatingField
        label={t('auth.new.confirm')}
        placeholder="••••••••"
        value={confirm}
        onChangeText={onConfirmChange}
        secureTextEntry={!showConfirm}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        adornment={showConfirm ? 'eye-off-outline' : 'eye-outline'}
        onAdornmentPress={() => setShowConfirm((v) => !v)}
        adornmentLabel={showConfirm ? t('auth.common.hidePassword') : t('auth.common.showPassword')}
      />
      {confirm.length > 0 && confirm !== password ? (
        <Text style={styles.mismatch} accessibilityLiveRegion="polite">
          {t('auth.mismatchInline')}
        </Text>
      ) : null}

      <CheckboxRow
        checked={rememberMe}
        onToggle={onToggleRemember}
        accessibilityLabel={t('auth.common.keepSignedIn')}
      >
        {t('auth.common.keepSignedIn')}
      </CheckboxRow>

      <CheckboxRow checked={agree} onToggle={onToggleAgree} accessibilityLabel={t('auth.new.agreePrefix')}>
        <>
          {t('auth.new.agreePrefix')}
          <Text style={styles.link} onPress={onOpenTerms}>
            {t('auth.terms')}
          </Text>
          {t('auth.new.and')}
          <Text style={styles.link} onPress={onOpenPrivacy}>
            {t('auth.privacy')}
          </Text>
          {t('auth.new.agreeSuffix')}
        </>
      </CheckboxRow>

      <GoldButton
        label={busy ? t('auth.new.busy') : t('auth.new.submit')}
        busy={busy}
        onPress={onSubmit}
      />

      <ActionsRow>
        <LinkButton label={t('auth.common.useDifferentEmail')} onPress={onChangeEmail} />
      </ActionsRow>
    </View>
  );
};

const styles = StyleSheet.create({
  // Tucked under the confirm field, as on the web.
  mismatch: { marginTop: -12, marginBottom: 16, fontSize: 13, color: C.mismatch },
  link: { color: C.gold },
});
