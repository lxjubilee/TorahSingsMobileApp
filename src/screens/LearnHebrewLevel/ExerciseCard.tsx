import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/common';
import type { Exercise } from '@/content/learnHebrew';
import {
  ACCENT,
  ACCENT_SOFT,
  CORRECT_TINT,
  HAIRLINE,
  HAIRLINE_STRONG,
  INK,
  INK_BODY,
  INK_FAINT,
  INK_MUTED,
  ON_ACCENT,
  WRONG_BORDER,
  WRONG_INK,
} from '../LearnHebrew/theme';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/**
 * One multiple-choice practice question (spec §6.6). State is local per card:
 * choose → choices lock and color (correct gold ✓ / chosen-wrong red / rest
 * dimmed) → teaching note + TRY AGAIN (resets this card only). Answers are
 * never persisted — the card resets when the screen unmounts (web parity).
 */
export const ExerciseCard: React.FC<{ exercise: Exercise }> = ({ exercise }) => {
  const [chosen, setChosen] = useState<number | null>(null);
  const answered = chosen !== null;

  return (
    <View style={styles.exercise}>
      <AppText style={styles.prompt}>{exercise.prompt}</AppText>

      {exercise.choices.map((choice, i) => {
        const isAnswer = i === exercise.answerIndex;
        const isChosen = i === chosen;
        const rowTone = !answered
          ? null
          : isAnswer
            ? styles.rowCorrect
            : isChosen
              ? styles.rowWrong
              : styles.rowDim;
        return (
          <Pressable
            key={i}
            disabled={answered}
            onPress={() => setChosen(i)}
            style={[styles.choice, rowTone]}
          >
            <View
              style={[
                styles.marker,
                answered && isAnswer && styles.markerCorrect,
                answered && isChosen && !isAnswer && styles.markerWrong,
              ]}
            >
              <AppText
                allowFontScaling={false}
                style={[
                  styles.markerText,
                  answered && isAnswer && styles.markerTextCorrect,
                  answered && isChosen && !isAnswer && styles.markerTextWrong,
                ]}
              >
                {answered && isAnswer ? '✓' : LETTERS[i]}
              </AppText>
            </View>
            <AppText
              style={[
                styles.choiceText,
                answered && isAnswer && styles.choiceTextCorrect,
                answered && isChosen && !isAnswer && styles.choiceTextWrong,
              ]}
            >
              {choice}
            </AppText>
          </Pressable>
        );
      })}

      {answered ? (
        <>
          {/* The teaching "why", revealed after answering. */}
          <View style={styles.note}>
            <AppText style={styles.noteText}>{exercise.note}</AppText>
          </View>
          <Pressable onPress={() => setChosen(null)} hitSlop={10} style={styles.again}>
            {({ pressed }) => (
              <AppText style={[styles.againText, pressed && styles.againPressed]}>
                TRY AGAIN
              </AppText>
            )}
          </Pressable>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  exercise: { paddingVertical: 14 },
  prompt: { fontSize: 15, lineHeight: 22, color: INK },
  choice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 10,
    padding: 11,
    marginTop: 9,
  },
  rowCorrect: { borderColor: ACCENT, backgroundColor: CORRECT_TINT },
  rowWrong: { borderColor: WRONG_BORDER },
  rowDim: { opacity: 0.45 },
  marker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: HAIRLINE_STRONG,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  markerCorrect: { backgroundColor: ACCENT, borderColor: ACCENT },
  markerWrong: { borderColor: WRONG_INK },
  markerText: { fontSize: 11, lineHeight: 14, fontWeight: '700', color: INK_FAINT },
  markerTextCorrect: { color: ON_ACCENT },
  markerTextWrong: { color: WRONG_INK },
  choiceText: { flex: 1, fontSize: 14, lineHeight: 20, color: INK_BODY },
  choiceTextCorrect: { color: INK },
  choiceTextWrong: { color: INK_MUTED },
  note: { borderLeftWidth: 2, borderLeftColor: ACCENT, paddingLeft: 12, marginTop: 12 },
  noteText: { fontSize: 13, lineHeight: 19, color: INK_BODY },
  again: { alignSelf: 'flex-start', marginTop: 12 },
  againText: { fontSize: 10, letterSpacing: 1.2, fontWeight: '700', color: INK_FAINT },
  againPressed: { color: ACCENT_SOFT },
});
