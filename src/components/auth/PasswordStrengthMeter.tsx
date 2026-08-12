import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { authPalette as C } from './authPalette';

export type StrengthScore = 1 | 2 | 3 | 4;

/**
 * Ported verbatim from the web's `passwordStrength()`. One point each for
 * length ≥ 8, length ≥ 12, mixed case, a digit and a symbol — then anything
 * under 8 characters is capped at "Weak" regardless of what else it contains.
 */
export function passwordStrength(pw: string): StrengthScore {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (pw.length >= 12) s += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1;
  if (/\d/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  if (pw.length < 8) s = Math.min(s, 1);
  return Math.min(4, Math.max(1, s)) as StrengthScore;
}

/** The web's `.strength` block — a quarter-width bar per point, plus a label. */
export const PasswordStrengthMeter: React.FC<{ password: string }> = ({ password }) => {
  const { t } = useTranslation();
  if (!password) return null;

  const score = passwordStrength(password);
  const color = C.strength[score - 1];

  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite">
      <View style={styles.track}>
        <View style={[styles.bar, { width: `${score * 25}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.label, { color }]}>{t(`auth.strength.${score}`)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Negative top margin tucks it under the password field, as on the web.
  wrap: { marginTop: -12, marginBottom: 16 },
  track: { height: 4, borderRadius: 999, backgroundColor: C.strengthTrack, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 999 },
  label: { marginTop: 6, fontSize: 13, fontWeight: '600' },
});
