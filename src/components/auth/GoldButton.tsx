import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authPalette as C } from './authPalette';

interface GoldButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Shows a spinner beside the label; also implies disabled. */
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * The web's `.submit`: a full-width gold gradient CTA. Every phase ends in one
 * of these, so the busy label ("Checking…", "Creating account…") is passed in
 * rather than derived here.
 */
export const GoldButton: React.FC<GoldButtonProps> = ({
  label,
  onPress,
  disabled = false,
  busy = false,
  style,
}) => {
  const off = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy }}
      style={[styles.wrap, off && styles.off, style]}
    >
      <LinearGradient colors={C.ctaGradient} style={styles.gradient}>
        {busy ? <ActivityIndicator size="small" color={C.ctaLabel} style={styles.spinner} /> : null}
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: 6, borderRadius: 8, overflow: 'hidden' },
  off: { opacity: 0.7 },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  spinner: { marginRight: 8 },
  label: { color: C.ctaLabel, fontWeight: '800', fontSize: 15 },
});
