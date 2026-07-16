import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT, HAIRLINE_STRONG, ON_ACCENT } from '../theme';

/**
 * Presentational 44pt disc (spec §6.3): solid gold disc with a dark play
 * triangle when unlocked; a hairline "keyhole" ring with a centered dot when
 * locked. The parent row is the touch target — this never handles presses.
 */
export const PlayDisc: React.FC<{ locked: boolean; size?: number }> = ({ locked, size = 44 }) => {
  const round = { width: size, height: size, borderRadius: size / 2 };
  if (locked) {
    return (
      <View style={[styles.lockedDisc, round]}>
        <View style={styles.lockedDot} />
      </View>
    );
  }
  return (
    <View style={[styles.playDisc, round]}>
      <Ionicons name="play" size={Math.round(size * 0.42)} color={ON_ACCENT} style={styles.playIcon} />
    </View>
  );
};

const styles = StyleSheet.create({
  playDisc: { backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  playIcon: { marginLeft: 2 },
  lockedDisc: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: HAIRLINE_STRONG },
});
