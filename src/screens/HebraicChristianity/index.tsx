import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, AppText, CelestialArt, LanguagePanel } from '@/components/common';
import { useAppSelector } from '@/hooks';
import { articles } from '@/content/articles/data';
import { ARTICLE_CATEGORIES, type Article, type ArticleCategory } from '@/content/articles/types';
import { HomeHeader, CHIP_ROW_HEIGHT } from '../Home/components/HomeHeader';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Filter = ArticleCategory | 'All';
const FILTERS: Filter[] = ['All', ...ARTICLE_CATEGORIES];

// Web hero palette (globals.css) for continuity with the rest of the port.
const ACCENT_SOFT = '#ffd877';
const INK = '#f0ebe3';
const INK_MUTED = '#7f86a8';
const INK_BODY = '#b8bcd4';

/** One article tile — celestial cover + category / title / dek / meta. */
const ArticleCard: React.FC<{ article: Article; featured?: boolean; onPress: () => void }> = ({
  article,
  featured,
  onPress,
}) => {
  const locked = !article.freeTier;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, featured && styles.cardFeatured, { opacity: pressed ? 0.85 : 1 }]}
    >
      <CelestialArt
        hue={article.art.hue}
        glyph={article.art.glyph}
        glyphSize={featured ? 96 : 64}
        style={[styles.art, { height: featured ? 200 : 150 }]}
      />
      <View style={styles.cardBody}>
        {featured ? <AppText style={styles.featuredFlag}>THE DEEPENING BEGINS HERE</AppText> : null}
        <AppText style={styles.category}>{article.category}</AppText>
        <AppText style={styles.title}>{article.title}</AppText>
        <AppText style={styles.dek} numberOfLines={3}>
          {article.dek}
        </AppText>
        <AppText style={styles.meta}>
          {locked
            ? `Members · ${article.readingTime} min`
            : `Read aloud · ${article.presenter} · ${article.readingTime} min`}
        </AppText>
      </View>
    </Pressable>
  );
};

/**
 * The article library — owns the category `filter`, the chips, and the cards.
 * Because the filter state lives HERE (not in the screen), selecting a category
 * re-renders only this section; the shared header + hero above stay mounted and
 * never reload. Memoized so unrelated screen re-renders don't touch it.
 */
const ArticleLibrary: React.FC<{ onOpen: (a: Article) => void }> = React.memo(({ onOpen }) => {
  const [filter, setFilter] = useState<Filter>('All');

  const visible = useMemo(
    () => (filter === 'All' ? articles : articles.filter((a) => a.category === filter)),
    [filter],
  );
  const featured = filter === 'All' ? visible.find((a) => a.featured) : undefined;
  const rest = featured ? visible.filter((a) => a.slug !== featured.slug) : visible;

  return (
    <>
      {/* Category filter chips. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {FILTERS.map((f) => {
          const active = f === filter;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <AppText style={[styles.chipText, { color: active ? '#0a0e14' : INK_BODY }]}>
                {f}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {featured ? <ArticleCard article={featured} featured onPress={() => onOpen(featured)} /> : null}

      {rest.map((a) => (
        <ArticleCard key={a.slug} article={a} onPress={() => onOpen(a)} />
      ))}

      {rest.length === 0 && !featured ? (
        <AppText style={styles.empty}>Nothing has surfaced under this heading yet. It will.</AppText>
      ) : null}
    </>
  );
});
ArticleLibrary.displayName = 'ArticleLibrary';

/** Hebraic Christianity — "Prong II". The shared app header and the page hero are
 *  static; category filtering happens entirely inside <ArticleLibrary>, so the
 *  header and hero never re-render when a chip is selected. */
export const HebraicChristianityScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const language = useAppSelector((s) => s.settings.language);
  const [langPanelOpen, setLangPanelOpen] = useState(false);

  const open = useCallback(
    (a: Article) => navigation.navigate('Article', { slug: a.slug }),
    [navigation],
  );
  const openProfile = useCallback(
    () => navigation.navigate('MainTabs', { screen: 'PlaylistsTab', params: { screen: 'Profile' } }),
    [navigation],
  );

  return (
    <Screen safeArea={false}>
      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 64 + CHIP_ROW_HEIGHT,
          paddingBottom: 40 + insets.bottom,
        }}
      >
        {/* Page hero (static). */}
        <View style={styles.hero}>
          <AppText style={styles.eyebrow}>PRONG II · THE DEEPENING</AppText>
          <AppText style={styles.heroTitle}>Hebraic Christianity</AppText>
          <AppText style={styles.heroLede}>
            The songs are only the entry point. Underneath them lies a whole grammar of meaning —
            pictographs that predate the letters, appointed times kept on a calendar older than the
            nations, covenants that were cut rather than signed.
          </AppText>
        </View>

        {/* Only this section re-renders when a category chip is selected. */}
        <ArticleLibrary onOpen={open} />
      </ScrollView>

      {/* Shared app header, with Hebraic Christianity selected (never re-renders on filter). */}
      <HomeHeader
        activeChip="HEBRAIC CHRISTIANITY"
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
  flex: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 18 },
  eyebrow: { fontSize: 11, letterSpacing: 1.6, fontWeight: '700', color: ACCENT_SOFT, marginBottom: 8 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: INK, marginBottom: 10 },
  heroLede: { fontSize: 14, lineHeight: 21, color: INK_BODY },
  chips: { paddingHorizontal: 20, paddingBottom: 18, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: ACCENT_SOFT, borderColor: ACCENT_SOFT },
  chipText: { fontSize: 13, fontWeight: '700' },
  card: { marginHorizontal: 16, marginBottom: 18, borderRadius: 14, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)' },
  cardFeatured: { borderWidth: 1, borderColor: 'rgba(255,216,119,0.35)' },
  art: { width: '100%' },
  cardBody: { padding: 16 },
  featuredFlag: { fontSize: 10, letterSpacing: 1.4, fontWeight: '700', color: ACCENT_SOFT, marginBottom: 8 },
  category: { fontSize: 11, letterSpacing: 0.8, fontWeight: '700', color: INK_MUTED, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', color: INK, marginBottom: 6 },
  dek: { fontSize: 14, lineHeight: 20, color: INK_BODY, marginBottom: 10 },
  meta: { fontSize: 12, color: INK_MUTED },
  empty: { textAlign: 'center', color: INK_MUTED, paddingHorizontal: 32, paddingTop: 40 },
});
