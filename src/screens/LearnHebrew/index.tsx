import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, LanguagePanel } from '@/components/common';
import { useAppSelector } from '@/hooks';
import { HomeHeader, CHIP_ROW_HEIGHT } from '../Home/components/HomeHeader';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: W } = Dimensions.get('window');

// Web hero palette (globals.css) — same constants as HebraicChristianity, so
// both prong pages share one look on the app's black background.
const ACCENT_SOFT = '#ffd877';
const GOLD_BTN = '#f7ca57';
const INK = '#f0ebe3';
const INK_MUTED = '#7f86a8';
const INK_BODY = '#b8bcd4';

// Letter tile row: first five letters + the "+17" tile (web parity, static).
const LETTER_TILES = ['א', 'ב', 'ג', 'ד', 'ה'];
const TILE_GAP = 10;
const H_PADDING = 20;
const TILE_W = Math.floor((W - H_PADDING * 2 - TILE_GAP * 5) / 6);

// Enable LayoutAnimation on Android's old architecture (no-op elsewhere).
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Lesson {
  n: string;
  title: string;
  min: string;
  desc: string;
}

interface Level {
  letter: string;
  kicker: string;
  title: string;
  meta: string;
  locked: boolean;
  /** Level page intro paragraph — present only when the lessons are public. */
  intro?: string;
  lessons?: Lesson[];
}

// The three course levels + Level 1's lesson list, ported verbatim from the
// web Learn Hebrew pages. Levels 2–3 are members-only, so their lesson content
// isn't available to port; their cards stay locked.
const LEVELS: Level[] = [
  {
    letter: 'א',
    kicker: 'LEVEL 1 · 22 LETTERS',
    title: 'The Aleph-Bet, Alive',
    meta: 'Zev Inspire · 6 lessons',
    locked: false,
    intro:
      'Twenty-two symbols, and before any of them made a sound, each one was a picture — an ox, a house, a foot, a door. Learn the pictures and the sounds follow, because that is the order in which they were made. You do not need fluency here; you need only the willingness to look at a letter and see the thing it once drew.',
    lessons: [
      {
        n: '01',
        title: 'Ox, House, Foot, Door',
        min: '9 min',
        desc: 'The first four symbols — א ב ג ד — as the pictures they were before they were letters. An ox head, a tent, a foot, a doorway.',
      },
      {
        n: '02',
        title: 'Behold, Nail, Mattock, Wall',
        min: '10 min',
        desc: 'ה ו ז ח. A figure with arms lifted, a peg, a harvesting blade, a boundary of stone. Four pictures, and one of them is doing a quiet job in nearly every verse.',
      },
      {
        n: '03',
        title: 'Basket, Hand, Palm, Staff',
        min: '11 min',
        desc: 'ט י כ ל. At the tenth letter the counting turns over, and the alphabet begins to climb by tens.',
      },
      {
        n: '04',
        title: 'Water, Seed, Prop, Eye',
        min: '11 min',
        desc: 'מ נ ס ע. The deep, the heir, the post that holds a thing upright, and the eye that takes it all in.',
      },
      {
        n: '05',
        title: 'Mouth, Hook, Sun, Head',
        min: '12 min',
        desc: 'פ צ ק ר. A mouth opens, a hook catches, the sun rests on the horizon, and a head lifts. Here the alphabet leaves the tens behind and climbs by hundreds.',
      },
      {
        n: '06',
        title: 'Teeth, Mark, and the Five That Change Shape',
        min: '13 min',
        desc: 'ש and ת close the twenty-two. Then the five letters that take a different form when they come to the end of a word — and what happens to them when you count.',
      },
    ],
  },
  {
    letter: 'ב',
    kicker: 'LEVEL 2 · YOUR FIRST 40 WORDS',
    title: 'First Words & Roots',
    meta: 'Zariah Inspire · 6 lessons · Members',
    locked: true,
  },
  {
    letter: 'ש',
    kicker: 'LEVEL 3 · SYMBOLS BEHIND THE SOUNDS',
    title: 'Reading the Paleo Layer',
    meta: 'Zev Inspire & Zariah Inspire · 6 lessons · Members',
    locked: true,
  },
];

/**
 * Learn Hebrew — "Prong III", ported from the web page onto the app's standard
 * black theme (matches HebraicChristianity): hero (eyebrow → title → lede),
 * the Twenty-Two Letters tile row, and the Three Levels course cards. Level 1
 * expands in place (accordion) to its intro + lesson list, mirroring the web's
 * level page; the members-only levels stay locked.
 */
export const LearnHebrewScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const language = useAppSelector((s) => s.settings.language);
  const [langPanelOpen, setLangPanelOpen] = useState(false);
  // Which level card is expanded to show its lesson list (accordion).
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);

  const toggleLevel = useCallback((title: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedLevel((cur) => (cur === title ? null : title));
  }, []);

  const openProfile = useCallback(
    () => navigation.navigate('MainTabs', { screen: 'PlaylistsTab', params: { screen: 'Profile' } }),
    [navigation],
  );

  return (
    <Screen safeArea={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 64 + CHIP_ROW_HEIGHT,
          paddingBottom: 40 + insets.bottom,
        }}
      >
        {/* Page hero. */}
        <View style={styles.hero}>
          <AppText style={styles.eyebrow}>PRONG III · THE EMPOWERMENT</AppText>
          <AppText style={styles.heroTitle}>Learn Hebrew</AppText>
          <AppText style={styles.heroLede}>
            You do not need fluency. You need enough to open the text yourself and see what is
            standing in it — the picture inside the letter, the root under the word. Start where
            everyone starts. It is genuinely fun, and it goes further than you expect.
          </AppText>
        </View>

        {/* Twenty-two letters. */}
        <View style={styles.section}>
          <AppText style={styles.eyebrow}>TWENTY-TWO LETTERS</AppText>
          <View style={styles.tileRow}>
            {LETTER_TILES.map((letter) => (
              <View key={letter} style={styles.tile}>
                <AppText style={styles.tileLetter}>{letter}</AppText>
              </View>
            ))}
            <View style={styles.tile}>
              <AppText style={styles.tileMore}>+17</AppText>
            </View>
          </View>
          <AppText style={styles.caption}>
            Each one was a picture before it was a sound. An ox. A house. A door. Learn what they
            meant and the text starts speaking twice.
          </AppText>
        </View>

        {/* Three levels — unlocked levels expand in place to their lessons. */}
        <View style={styles.section}>
          <AppText style={styles.eyebrow}>THREE LEVELS</AppText>
          {LEVELS.map((level) => {
            const expandable = !level.locked && !!level.lessons?.length;
            const expanded = expandable && expandedLevel === level.title;
            return (
              <View key={level.title} style={styles.levelCard}>
                <Pressable
                  disabled={!expandable}
                  onPress={() => toggleLevel(level.title)}
                  style={({ pressed }) => [styles.levelHeader, { opacity: pressed ? 0.8 : 1 }]}
                >
                  <View style={styles.levelThumb}>
                    <AppText style={styles.levelThumbLetter}>{level.letter}</AppText>
                  </View>
                  <View style={styles.levelBody}>
                    <AppText style={styles.levelKicker}>{level.kicker}</AppText>
                    <AppText style={styles.levelTitle} numberOfLines={2}>
                      {level.title}
                    </AppText>
                    <AppText style={styles.levelMeta} numberOfLines={2}>
                      {level.meta}
                    </AppText>
                  </View>
                  {/* Gold circle: play → collapse chevron; locked levels keep the dot. */}
                  {level.locked ? (
                    <View style={styles.lockedCircle}>
                      <View style={styles.lockedDot} />
                    </View>
                  ) : (
                    <View style={styles.playCircle}>
                      <Ionicons
                        name={expanded ? 'chevron-up' : 'play'}
                        size={18}
                        color="#1a1405"
                        style={expanded ? undefined : styles.playIcon}
                      />
                    </View>
                  )}
                </Pressable>

                {expanded ? (
                  <View style={styles.levelDetail}>
                    <AppText style={styles.levelIntro}>{level.intro}</AppText>
                    {level.lessons?.map((lesson) => (
                      <View key={lesson.n} style={styles.lessonCard}>
                        <View style={styles.lessonTop}>
                          <AppText style={styles.lessonNum}>{lesson.n}</AppText>
                          <AppText style={styles.lessonTitle}>{lesson.title}</AppText>
                          <AppText style={styles.lessonMin}>{lesson.min}</AppText>
                        </View>
                        <AppText style={styles.lessonDesc}>{lesson.desc}</AppText>
                        <View style={styles.lessonPending}>
                          <AppText style={styles.lessonPendingText}>
                            LESSON FILM PENDING · EXERCISES BELOW ARE LIVE
                          </AppText>
                        </View>
                        <View style={styles.lessonFooter}>
                          <AppText style={styles.lessonPractice}>▸ PRACTICE · 3 QUESTIONS</AppText>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Shared app header, with Learn Hebrew selected. */}
      <HomeHeader
        activeChip="LEARN HEBREW"
        onPressProfile={openProfile}
        language={language}
        onPressLanguage={() => setLangPanelOpen(true)}
      />

      {langPanelOpen ? (
        <LanguagePanel selected={language} onClose={() => setLangPanelOpen(false)} />
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: { paddingHorizontal: H_PADDING, paddingTop: 18, paddingBottom: 6 },
  // Same eyebrow treatment as the HebraicChristianity hero.
  eyebrow: { fontSize: 11, letterSpacing: 1.6, fontWeight: '700', color: ACCENT_SOFT, marginBottom: 8 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: INK, marginBottom: 10 },
  heroLede: { fontSize: 14, lineHeight: 21, color: INK_BODY },
  section: { paddingHorizontal: H_PADDING, paddingTop: 28 },
  tileRow: { flexDirection: 'row', gap: TILE_GAP, marginTop: 4 },
  tile: {
    width: TILE_W,
    height: TILE_W,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLetter: { fontSize: 22, lineHeight: 28, color: INK },
  tileMore: { fontSize: 12, fontWeight: '700', color: INK_MUTED },
  caption: { fontSize: 13, lineHeight: 20, color: INK_BODY, marginTop: 14 },
  // Card treatment matches the HebraicChristianity article cards.
  levelCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    marginBottom: 14,
    marginTop: 4,
    overflow: 'hidden',
  },
  levelHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  levelDetail: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  levelIntro: { fontSize: 13, lineHeight: 20, color: INK_BODY, marginTop: 12 },
  lessonCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  lessonTop: { flexDirection: 'row', alignItems: 'center' },
  lessonNum: { fontSize: 12, fontWeight: '700', color: ACCENT_SOFT, marginRight: 8 },
  lessonTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: INK },
  lessonMin: { fontSize: 11, color: INK_MUTED, marginLeft: 8 },
  lessonDesc: { fontSize: 13, lineHeight: 19, color: INK_BODY, marginTop: 6 },
  lessonPending: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  lessonPendingText: { fontSize: 9, letterSpacing: 1, fontWeight: '700', color: INK_MUTED },
  lessonFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginTop: 12,
    paddingTop: 10,
  },
  lessonPractice: { fontSize: 10, letterSpacing: 1.2, fontWeight: '700', color: ACCENT_SOFT },
  levelThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelThumbLetter: { fontSize: 24, lineHeight: 30, color: INK },
  levelBody: { flex: 1, marginLeft: 14, marginRight: 10 },
  levelKicker: { fontSize: 10, letterSpacing: 1.4, fontWeight: '700', color: ACCENT_SOFT },
  levelTitle: { fontSize: 18, fontWeight: '800', color: INK, marginTop: 4 },
  levelMeta: { fontSize: 12, color: INK_MUTED, marginTop: 5 },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GOLD_BTN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { marginLeft: 2 },
  lockedCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
