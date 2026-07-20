import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText } from '@/components/common';
import { useAppSelector } from '@/hooks';
import {
  alephBet,
  canOpenLessonAlbum,
  getLessonAlbums,
  lessonAlbums,
  toEntitlement,
  type AlephLetter,
} from '@/content/learnHebrew';
import type { RootStackParamList } from '@/navigation/types';
import { ACCENT_SOFT, CARD_BG, HAIRLINE, INK, INK_BODY, INK_MUTED } from '../../LearnHebrew/theme';
import { Eyebrow } from '../../LearnHebrew/components/Eyebrow';
import { GlyphTile } from '../../LearnHebrew/components/GlyphTile';
import { PlayDisc } from '../../LearnHebrew/components/PlayDisc';
import { CHIP_ROW_HEIGHT } from '../components/HomeHeader';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: W } = Dimensions.get('window');

// Aleph-bet teaser row: first five letters + a "+{rest}" tile (spec §3).
const TEASER_COUNT = 5;
const TILE_GAP = 10;
const H_PADDING = 20;
const TILE_W = Math.floor((W - H_PADDING * 2 - TILE_GAP * TEASER_COUNT) / (TEASER_COUNT + 1));

/**
 * Learn Hebrew section body ("Prong III") — hero, the aleph-bet teaser tiles, and
 * the three level rows. Presentational: the shared header lives in the container.
 * Curriculum data is bundled (works offline); only the viewer's entitlement comes
 * from app state. Memoized so switching sections never re-renders it.
 */
export const LearnHebrewSection: React.FC = React.memo(() => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const entitlement = toEntitlement(useAppSelector((s) => s.entitlement.isPaid));
  // Tapping a teaser tile reveals that letter's pictographic sense (spec §3).
  const [pickedLetter, setPickedLetter] = useState<AlephLetter | null>(null);

  // Published albums, sorted by level — future-dated drops stay hidden.
  const albums = useMemo(() => getLessonAlbums(lessonAlbums), []);
  const teaser = alephBet.slice(0, TEASER_COUNT);

  return (
    <ScrollView
      style={styles.flex}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: insets.top + 64 + CHIP_ROW_HEIGHT,
        paddingBottom: 40 + insets.bottom,
      }}
    >
      {/* Page hero. */}
      <View style={styles.hero}>
        <Eyebrow>PRONG III · THE EMPOWERMENT</Eyebrow>
        <AppText style={styles.heroTitle}>Learn Hebrew</AppText>
        <AppText style={styles.heroLede}>
          You do not need fluency. You need enough to open the text yourself and see what is
          standing in it — the picture inside the letter, the root under the word. Start where
          everyone starts. It is genuinely fun, and it goes further than you expect.
        </AppText>
      </View>

      {/* Hairline rule dividing the hero from the sections below. */}
      <View style={styles.divider} />

      {/* Aleph-bet teaser. */}
      <View style={styles.section}>
        <Eyebrow>TWENTY-TWO LETTERS</Eyebrow>
        <View style={styles.tileRow}>
          {teaser.map((entry) => {
            const picked = pickedLetter?.letter === entry.letter;
            return (
              <Pressable
                key={entry.letter}
                onPress={() => setPickedLetter(picked ? null : entry)}
                style={({ pressed }) => [styles.tile, picked && styles.tilePicked, { opacity: pressed ? 0.7 : 1 }]}
              >
                <AppText allowFontScaling={false} style={styles.tileLetter}>
                  {entry.letter}
                </AppText>
              </Pressable>
            );
          })}
          <View style={styles.tile}>
            <AppText style={styles.tileMore}>+{alephBet.length - TEASER_COUNT}</AppText>
          </View>
        </View>
        {/* Tapped letter's name + pictographic sense (web shows it as a tooltip). */}
        {pickedLetter ? (
          <AppText style={styles.letterSense}>
            {pickedLetter.name} — {pickedLetter.sense}
          </AppText>
        ) : null}
        <AppText style={styles.caption}>
          Each one was a picture before it was a sound. An ox. A house. A door. Learn what they
          meant and the text starts speaking twice.
        </AppText>
      </View>

      {/* Three levels — every row navigates, locked or not. */}
      <View style={styles.section}>
        <Eyebrow>THREE LEVELS</Eyebrow>
        {albums.map((album) => {
          const locked = !canOpenLessonAlbum(album, entitlement).allowed;
          return (
            <Pressable
              key={album.slug}
              onPress={() => navigation.navigate('LearnHebrewLevel', { slug: album.slug })}
              style={({ pressed }) => [styles.levelRow, { opacity: pressed ? 0.8 : 1 }]}
            >
              <GlyphTile glyph={album.glyph} hue={album.hue} size={52} />
              <View style={styles.levelBody}>
                <AppText style={styles.levelKicker}>
                  LEVEL {album.level} · {album.subtitle.toUpperCase()}
                </AppText>
                <AppText style={styles.levelTitle} numberOfLines={2}>
                  {album.title}
                </AppText>
                <AppText style={styles.levelMeta} numberOfLines={2}>
                  {album.presenters.join(' & ')} · {album.lessons.length} lessons
                  {locked ? ' · Members' : ''}
                </AppText>
              </View>
              <PlayDisc locked={locked} />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
});

LearnHebrewSection.displayName = 'LearnHebrewSection';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { paddingHorizontal: H_PADDING, paddingTop: 18, paddingBottom: 24 },
  divider: {
    marginHorizontal: H_PADDING,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroTitle: { fontSize: 32, lineHeight: 40, fontWeight: '800', color: INK, marginBottom: 10 },
  heroLede: { fontSize: 14, lineHeight: 21, color: INK_BODY },
  section: { paddingHorizontal: H_PADDING, paddingTop: 28 },
  tileRow: { flexDirection: 'row', gap: TILE_GAP, marginTop: 4 },
  tile: {
    width: TILE_W,
    height: TILE_W,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: HAIRLINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tilePicked: { borderColor: ACCENT_SOFT },
  tileLetter: { fontSize: 22, lineHeight: 28, color: INK },
  tileMore: { fontSize: 12, fontWeight: '700', color: INK_MUTED },
  letterSense: { fontSize: 13, lineHeight: 19, color: ACCENT_SOFT, marginTop: 12 },
  caption: { fontSize: 13, lineHeight: 20, color: INK_BODY, marginTop: 14 },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    marginTop: 4,
  },
  levelBody: { flex: 1, marginLeft: 14, marginRight: 10 },
  levelKicker: { fontSize: 10, letterSpacing: 1.4, fontWeight: '700', color: ACCENT_SOFT },
  levelTitle: { fontSize: 18, lineHeight: 24, fontWeight: '800', color: INK, marginTop: 4 },
  levelMeta: { fontSize: 12, color: INK_MUTED, marginTop: 5 },
});
