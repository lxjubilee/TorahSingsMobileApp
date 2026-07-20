import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/common';
import type { Block } from '@/content/articles/types';
import { useReadAloud } from './useReadAloud';

interface ReadAloudButtonProps {
  id: string;
  blocks: Block[];
  presenter: string;
  audioUrl: string | null;
  /** Reading length, in minutes. */
  minutes: number;
}

const ACCENT = '#c9a84a';
const ACCENT_SOFT = '#ffd877';
const INK = '#f0ebe3';
const INK_FAINT = '#7f86a8';

/** One of the three bars that lift while a voice is reading. */
const Bar: React.FC<{ active: boolean; delay: number }> = ({ active, delay }) => {
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      lift.stopAnimation();
      lift.setValue(0);
      return;
    }
    // 0.9s ease in/out, staggered per bar — the web's `lift` keyframes.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(lift, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(lift, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [active, delay, lift]);

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: active ? ACCENT_SOFT : ACCENT,
          height: active ? lift.interpolate({ inputRange: [0, 1], outputRange: ['35%', '100%'] }) : '40%',
        },
      ]}
    />
  );
};

/** "Read aloud" plus the voice/length meta the design system calls for. */
export const ReadAloudButton: React.FC<ReadAloudButtonProps> = ({ id, blocks, presenter, audioUrl, minutes }) => {
  const { state, voice, toggle } = useReadAloud({ id, blocks, audioUrl });

  const speaking = state === 'speaking';
  const unsupported = state === 'unsupported';

  return (
    <View style={styles.row}>
      <Pressable
        onPress={toggle}
        disabled={unsupported}
        accessibilityRole="button"
        accessibilityState={{ disabled: unsupported, selected: speaking }}
        style={({ pressed }) => [
          styles.btn,
          speaking && styles.btnActive,
          unsupported && styles.btnDisabled,
          pressed && !unsupported && styles.btnPressed,
        ]}
      >
        <View style={styles.bars}>
          <Bar active={speaking} delay={0} />
          <Bar active={speaking} delay={150} />
          <Bar active={speaking} delay={300} />
        </View>
        <AppText style={styles.btnText}>
          {unsupported ? 'READ ALOUD UNAVAILABLE' : speaking ? 'STOP READING' : 'READ ALOUD'}
        </AppText>
      </Pressable>

      <AppText style={styles.meta}>
        {(voice === 'inspire' ? presenter : 'Device voice').toUpperCase()} · {minutes} MIN
      </AppText>
    </View>
  );
};

const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  btnActive: { borderColor: ACCENT, backgroundColor: 'rgba(201,168,74,0.07)' },
  btnPressed: { borderColor: ACCENT_SOFT, backgroundColor: 'rgba(232,217,168,0.04)' },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: MONO, fontSize: 11, fontWeight: '500', letterSpacing: 1.8, color: INK },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 12 },
  bar: { width: 2, borderRadius: 999 },
  meta: { fontFamily: MONO, fontSize: 10.5, letterSpacing: 1.9, color: INK_FAINT },
});
