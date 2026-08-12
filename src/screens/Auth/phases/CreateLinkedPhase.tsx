import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  ActionsRow,
  authTextStyles as T,
  CheckboxRow,
  DobField,
  FloatingField,
  floatingFieldStyles as F,
  GoldButton,
  LinkButton,
} from '@/components/auth';

const SITE_NAME = 'Torah Sings';

interface CreateLinkedPhaseProps {
  firstName: string;
  lastName: string;
  dob: string | null;
  rememberMe: boolean;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onDobChange: (v: string) => void;
  onToggleRemember: () => void;
  onSubmit: () => void;
  onChangeEmail: () => void;
  busy: boolean;
}

/**
 * Screen 2B-2 — the Jubilee Account password checked out, so all that's missing
 * is the local Torah Sings account. First/Last/DOB arrive pre-filled from the
 * authority and stay editable; any edit is synced back to the shared Jubilee
 * Account before the local row is provisioned. No password field: the credential
 * already exists and lives at the authority.
 */
export const CreateLinkedPhase: React.FC<CreateLinkedPhaseProps> = ({
  firstName,
  lastName,
  dob,
  rememberMe,
  onFirstNameChange,
  onLastNameChange,
  onDobChange,
  onToggleRemember,
  onSubmit,
  onChangeEmail,
  busy,
}) => {
  const { t } = useTranslation();

  return (
    <View>
      <Text style={T.title}>{t('auth.createlinked.title', { site: SITE_NAME })}</Text>
      <Text style={T.subtitle}>{t('auth.createlinked.subtitle')}</Text>

      <View style={F.nameRow}>
        <FloatingField
          style={F.nameCol}
          label={t('auth.common.firstName')}
          value={firstName}
          onChangeText={onFirstNameChange}
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

      <CheckboxRow
        checked={rememberMe}
        onToggle={onToggleRemember}
        accessibilityLabel={t('auth.common.keepSignedIn')}
      >
        {t('auth.common.keepSignedIn')}
      </CheckboxRow>

      <GoldButton
        label={busy ? t('auth.createlinked.busy') : t('auth.createlinked.submit')}
        busy={busy}
        onPress={onSubmit}
      />

      <ActionsRow>
        <LinkButton label={t('auth.common.useDifferentEmail')} onPress={onChangeEmail} />
      </ActionsRow>
    </View>
  );
};
