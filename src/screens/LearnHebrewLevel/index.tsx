import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, AppText, IconButton } from '@/components/common';
import { useAppSelector } from '@/hooks';
import { canOpenLesson, getLessonAlbum, lessonAlbums, toEntitlement } from '@/content/learnHebrew';
import type { RootStackParamList, RootStackScreenProps } from '@/navigation/types';
import { INK, INK_BODY, INK_FAINT, INK_MUTED } from '../LearnHebrew/theme';
import { Eyebrow } from '../LearnHebrew/components/Eyebrow';
import { GlyphTile } from '../LearnHebrew/components/GlyphTile';
import { LessonCard } from './LessonCard';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const H_PADDING = 20;
// Height of the pinned black header row (back button + "All levels" label).
const HEADER_HEIGHT = 38;

/**
 * Level detail — Screen B of the feature spec (web /learn-hebrew/{slug}):
 * glyph hero, intro, and six lesson cards gated by canOpenLesson (lesson 1 is
 * open for everyone). Locked levels still render fully. Unknown slug →
 * graceful not-found.
 */
export const LearnHebrewLevelScreen: React.FC = () => {
  const { params } = useRoute<RootStackScreenProps<'LearnHebrewLevel'>['route']>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const entitlement = toEntitlement(useAppSelector((s) => s.entitlement.isPaid));

  const album = useMemo(() => getLessonAlbum(lessonAlbums, params.slug), [params.slug]);

  const backHeader = (
    <View
      style={[styles.fixedHeader, { paddingTop: insets.top, height: insets.top + HEADER_HEIGHT }]}
    >
      <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
      <AppText style={styles.backLabel}>ALL LEVELS</AppText>
    </View>
  );

  if (!album) {
    return (
      <Screen safeArea={false}>
        <View style={styles.missing}>
          <AppText variant="body" color="textMuted">
            Level not found.
          </AppText>
        </View>
        {backHeader}
      </Screen>
    );
  }

  return (
    <Screen safeArea={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + HEADER_HEIGHT + 14,
          paddingBottom: 40 + insets.bottom,
        }}
      >
        {/* Hero row: hue-tinted glyph + kicker / title / presenters. */}
        <View style={styles.hero}>
          <GlyphTile glyph={album.glyph} hue={album.hue} size={96} />
          <View style={styles.heroText}>
            <Eyebrow>
              LEVEL {album.level} · {album.subtitle.toUpperCase()}
            </Eyebrow>
            <AppText style={styles.title}>{album.title}</AppText>
            <AppText style={styles.taughtBy}>
              TAUGHT BY {album.presenters.join(' & ').toUpperCase()}
            </AppText>
          </View>
        </View>

        <AppText style={styles.intro}>{album.intro}</AppText>

        {/* Lesson cards — lesson 1 is open for everyone, on every level. */}
        <View style={styles.lessons}>
          {album.lessons.map((lesson) => (
            <LessonCard
              key={lesson.n}
              lesson={lesson}
              locked={!canOpenLesson(album, lesson.n, entitlement).allowed}
            />
          ))}
        </View>

      </ScrollView>

      {backHeader}
    </Screen>
  );
};

const styles = StyleSheet.create({
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  backLabel: { fontSize: 10, letterSpacing: 1.4, fontWeight: '700', color: INK_MUTED, marginLeft: 2 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: H_PADDING },
  heroText: { flex: 1, marginLeft: 16 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: INK },
  taughtBy: { fontSize: 10, letterSpacing: 1.2, fontWeight: '700', color: INK_FAINT, marginTop: 8 },
  intro: { fontSize: 14, lineHeight: 21, color: INK_BODY, paddingHorizontal: H_PADDING, marginTop: 18 },
  lessons: { paddingHorizontal: H_PADDING, marginTop: 8 },
});
