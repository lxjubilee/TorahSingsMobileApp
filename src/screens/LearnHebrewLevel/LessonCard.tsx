import React, { useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import { AppText } from '@/components/common';
import type { Lesson } from '@/content/learnHebrew';
import {
  ACCENT_SOFT,
  CARD_BG,
  HAIRLINE,
  INK,
  INK_BODY,
  INK_FAINT,
  INK_MUTED,
} from '../LearnHebrew/theme';
import { ExerciseCard } from './ExerciseCard';

// Enable LayoutAnimation on Android's old architecture (no-op elsewhere).
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * One lesson (spec §6.5): head row (number · title · duration) + summary, then
 * — locked:   the whole card dims to 62% with an "unlocks" note;
 * — unlocked: the dashed "film pending" note (while mediaUrl is null) and the
 *   Practice accordion (collapsed by default, ~250ms ease, caret rotates 90°,
 *   independent per lesson).
 */
export const LessonCard: React.FC<{ lesson: Lesson; locked: boolean }> = ({ lesson, locked }) => {
  const [open, setOpen] = useState(false);
  const caret = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(250, 'easeInEaseOut', 'opacity'));
    Animated.timing(caret, {
      toValue: open ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setOpen((o) => !o);
  };

  const count = lesson.exercises.length;
  const practiceLabel = `PRACTICE · ${count} QUESTION${count === 1 ? '' : 'S'}`;

  return (
    <View style={[styles.card, locked && styles.cardLocked]}>
      <View style={styles.inner}>
        <View style={styles.head}>
          <AppText style={styles.num}>{String(lesson.n).padStart(2, '0')}</AppText>
          <AppText style={styles.title}>{lesson.title}</AppText>
          <AppText style={styles.duration}>{lesson.durationMinutes} min</AppText>
        </View>
        <AppText style={styles.summary}>{lesson.summary}</AppText>

        {locked ? (
          <AppText style={styles.lockedNote}>UNLOCKS WITH MEMBERSHIP</AppText>
        ) : lesson.mediaUrl == null ? (
          <View style={styles.pending}>
            <AppText style={styles.pendingText}>
              LESSON FILM PENDING · EXERCISES BELOW ARE LIVE
            </AppText>
          </View>
        ) : null}
      </View>

      {/* Practice accordion — the hairline runs edge-to-edge (card clips it). */}
      {!locked && count > 0 ? (
        <>
          <Pressable onPress={toggle} style={styles.accordionHead}>
            {({ pressed }) => (
              <>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: caret.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '90deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <AppText style={[styles.caret, pressed && styles.accordionPressed]}>▸</AppText>
                </Animated.View>
                <AppText style={[styles.accordionLabel, pressed && styles.accordionPressed]}>
                  {practiceLabel}
                </AppText>
              </>
            )}
          </Pressable>
          {open ? (
            <View style={styles.exercises}>
              {lesson.exercises.map((exercise, i) => (
                <View key={i} style={i > 0 ? styles.exerciseDivider : undefined}>
                  <ExerciseCard exercise={exercise} />
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 12,
    marginTop: 14,
    overflow: 'hidden',
  },
  cardLocked: { opacity: 0.62 },
  inner: { padding: 14 },
  head: { flexDirection: 'row', alignItems: 'baseline' },
  num: { fontSize: 11, fontWeight: '700', color: ACCENT_SOFT, opacity: 0.75, marginRight: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: '800', color: INK },
  duration: { fontSize: 11, color: INK_MUTED, marginLeft: 8 },
  summary: { fontSize: 13, lineHeight: 19, color: INK_BODY, marginTop: 6 },
  lockedNote: {
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
    color: INK_FAINT,
    marginTop: 12,
  },
  pending: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: HAIRLINE,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  pendingText: { fontSize: 9, letterSpacing: 1, fontWeight: '700', color: INK_MUTED },
  accordionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  caret: { fontSize: 11, lineHeight: 13, color: INK_FAINT },
  accordionLabel: { fontSize: 10, letterSpacing: 1.2, fontWeight: '700', color: INK_MUTED },
  accordionPressed: { color: ACCENT_SOFT },
  exercises: { paddingHorizontal: 14, paddingBottom: 4 },
  exerciseDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: HAIRLINE },
});
