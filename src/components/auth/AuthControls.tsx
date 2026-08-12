import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { authPalette as C } from './authPalette';

/**
 * The web's `.linkBtn` / `.forgot a` — a gold text button. Used for "Use a
 * different email", "Resend code", "Forgot your password?" and friends.
 */
export const LinkButton: React.FC<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}> = ({ label, onPress, disabled = false, style, textStyle }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    hitSlop={8}
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    style={style}
  >
    <Text style={[styles.link, disabled && styles.linkDisabled, textStyle]}>{label}</Text>
  </Pressable>
);

/**
 * The web's inline `acctStyle` row: which address the flow is working on, plus
 * an escape hatch back to the email phase. Shown on every phase after the first
 * so the user is never guessing which account they're about to sign into.
 */
export const AccountRow: React.FC<{ email: string; onChangeEmail: () => void }> = ({
  email,
  onChangeEmail,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.account}>
      <Text style={styles.accountEmail} numberOfLines={2}>
        {email}
      </Text>
      <LinkButton
        label={t('auth.common.useDifferentEmail')}
        onPress={onChangeEmail}
        textStyle={styles.accountLink}
      />
    </View>
  );
};

/** The web's `.check` — a 16px box with gold fill and a wrapping label. */
export const CheckboxRow: React.FC<{
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  accessibilityLabel: string;
}> = ({ checked, onToggle, children, accessibilityLabel }) => (
  <Pressable
    style={styles.check}
    onPress={onToggle}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
    accessibilityLabel={accessibilityLabel}
  >
    <View style={[styles.box, checked && styles.boxChecked]}>
      {checked ? <Ionicons name="checkmark" size={12} color={C.ctaLabel} /> : null}
    </View>
    <Text style={styles.checkLabel}>{children}</Text>
  </Pressable>
);

/** The web's `.forgot` — right-aligned, tucked up against the field above. */
export const ForgotRow: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.forgot}>
      <LinkButton label={t('auth.common.forgot')} onPress={onPress} />
    </View>
  );
};

/** The web's `.codeActions` — a pair of link buttons on either edge. */
export const ActionsRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.actions}>{children}</View>
);

const styles = StyleSheet.create({
  link: { color: C.gold, fontSize: 13 },
  linkDisabled: { color: C.footer },

  account: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: C.accountBorder,
    borderRadius: 8,
    backgroundColor: C.accountBg,
    marginBottom: 18,
  },
  accountEmail: { flexShrink: 1, color: C.text, fontSize: 14 },
  accountLink: { fontSize: 13 },

  check: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  box: {
    width: 16,
    height: 16,
    marginTop: 1,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: C.gold },
  checkLabel: { flex: 1, fontSize: 13, lineHeight: 18, color: C.textMuted },

  forgot: { alignItems: 'flex-end', marginTop: -4, marginBottom: 14 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 14 },
});
