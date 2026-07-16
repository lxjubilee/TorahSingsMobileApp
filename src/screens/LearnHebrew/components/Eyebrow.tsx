import React from 'react';
import { StyleProp, StyleSheet, TextStyle } from 'react-native';
import { AppText } from '@/components/common';
import { ACCENT_SOFT } from '../theme';

/** Gold caps section label (spec §6.1) — same treatment as HebraicChristianity. */
export const Eyebrow: React.FC<{ children: React.ReactNode; style?: StyleProp<TextStyle> }> = ({
  children,
  style,
}) => <AppText style={[styles.eyebrow, style]}>{children}</AppText>;

const styles = StyleSheet.create({
  eyebrow: { fontSize: 11, letterSpacing: 1.6, fontWeight: '700', color: ACCENT_SOFT, marginBottom: 8 },
});
