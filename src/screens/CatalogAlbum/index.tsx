import React, { useMemo } from 'react';
import { Dimensions, FlatList, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StarRating } from '@/components/reviews';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, AppText, IconButton, SectionHeader } from '@/components/common';
import { angelsCatalog } from '@/content/angelsCatalog/data';
import { catalogCover } from '@/content/angelsCatalog/covers';
import type { CatalogAlbum, CatalogCategory } from '@/content/angelsCatalog/types';
import { CatalogTile } from '../Home/components/CatalogTile';
import type { RootStackParamList, RootStackScreenProps } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const H_PADDING = 16;
const COVER_W = width - H_PADDING * 2;
// Height of the pinned black header row holding the back button (matches
// CatalogCategory / AlbumDetails).
const HEADER_HEIGHT = 38;

// Preview cap for the horizontal album rails (matches the Home catalog rails).
const MAX_RAIL = 12;

// Green used for the book pill (border + text), matching the AlbumDetails
// primary-genre pill and the web album header.
const GENRE_GREEN = '#3FA45C';

// Web hero palette (globals.css) for continuity with the rest of the port.
const ACCENT_SOFT = '#ffd877';
const INK = '#f0ebe3';
const INK_MUTED = '#7f86a8';

/** Album + its division, looked up by catalog code. */
function findAlbum(code: string): { album: CatalogAlbum; category: CatalogCategory } | null {
  for (const category of angelsCatalog) {
    const album = category.albums.find((a) => a.code === code);
    if (album) return { album, category };
  }
  return null;
}

/**
 * Angels' Catalog album detail (ported from the web album page, laid out like
 * the app's AlbumDetails): cover, book eyebrow, title, "Sung by the Angels"
 * meta, PLAY ALBUM, the numbered track list, and a "More from <book>" rail.
 * Playback is visual-only for now — the catalog's audio isn't wired to the
 * mobile player yet, so the play controls render but don't stream.
 */
export const CatalogAlbumScreen: React.FC = () => {
  const { params } = useRoute<RootStackScreenProps<'CatalogAlbum'>['route']>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const found = useMemo(() => findAlbum(params.code), [params.code]);

  // Sibling albums for the bottom rail: same book first, else same division.
  // `moreBook` carries the book filter into the "View All" grid (undefined when
  // the rail fell back to the whole division).
  const { moreTitle, moreAlbums, moreBook } = useMemo(() => {
    if (!found) {
      return { moreTitle: '', moreAlbums: [] as CatalogAlbum[], moreBook: undefined as string | undefined };
    }
    const { album, category } = found;
    const sameBook = category.albums.filter((a) => a.book === album.book && a.code !== album.code);
    if (sameBook.length) {
      return { moreTitle: `More from ${album.book}`, moreAlbums: sameBook, moreBook: album.book };
    }
    return {
      moreTitle: `More from ${category.title}`,
      moreAlbums: category.albums.filter((a) => a.code !== album.code),
      moreBook: undefined,
    };
  }, [found]);

  // Division rail (shown before "More from"): this division's other albums.
  const divisionAlbums = useMemo(
    () => (found ? found.category.albums.filter((a) => a.code !== found.album.code) : []),
    [found],
  );

  if (!found) {
    return (
      <Screen safeArea={false}>
        <View style={styles.missing}>
          <AppText variant="body" color="textMuted">
            Album not found.
          </AppText>
        </View>
        <View style={[styles.fixedHeader, { paddingTop: insets.top, height: insets.top + HEADER_HEIGHT }]}>
          <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  const { album, category } = found;
  const cover = catalogCover(album.code);

  return (
    <Screen safeArea={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + HEADER_HEIGHT + 8,
          paddingBottom: 40 + insets.bottom,
        }}
      >
        {/* Cover — bundled art, or the celestial placeholder (hue + glyph). */}
        {cover ? (
          <Image source={cover} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.celestial, { backgroundColor: `hsl(${album.hue}, 45%, 18%)` }]}>
            <AppText style={[styles.glyph, { color: `hsla(${album.hue}, 70%, 78%, 0.55)` }]}>
              {album.glyph ?? '✧'}
            </AppText>
          </View>
        )}

        {/* Book eyebrow → title → meta line (web album header, centered like
            the app's AlbumDetails). */}
        <View style={styles.headerBlock}>
          {/* Book pill — same green genre-pill treatment as AlbumDetails. */}
          <View style={styles.bookPill}>
            <AppText variant="caption" style={styles.bookPillText}>
              {album.book.toUpperCase()}
            </AppText>
          </View>
          <AppText variant="display" style={styles.title}>
            {album.title}
          </AppText>
          <AppText variant="bodySm" style={styles.metaLine}>
            Sung by the Angels · {album.tracks.length} {album.tracks.length === 1 ? 'song' : 'songs'} ·{' '}
            {category.title}
          </AppText>

        </View>

        {/* Action row (mirrors AlbumDetails: like / share / add-to-playlist ·
            shuffle / Play) — visual-only until the catalog is backend-wired. */}
        <View style={styles.actions}>
          <View style={styles.actionsSide}>
            <IconButton name="heart-outline" size={28} />
            <IconButton name="share-outline" size={26} style={styles.actionGap} />
            <MaterialCommunityIcons
              name="playlist-plus"
              size={28}
              color="#FFFFFF"
              style={styles.actionGap}
            />
          </View>
          <View style={styles.actionsSide}>
            <IconButton name="shuffle" size={26} />
            <View style={[styles.playPill, styles.actionGap]}>
              <Ionicons name="play" size={18} color="#1a1405" style={styles.playIcon} />
              <AppText variant="label" style={styles.playLabel}>
                {t('common.play')}
              </AppText>
            </View>
          </View>
        </View>

        {/* Rating summary card (mirrors AlbumDetails' AlbumRatingSummary) —
            display-only: these albums aren't in the reviews backend yet. */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingRow}>
            <StarRating value={0} size="md" />
            <AppText variant="bodySm" color="textMuted" style={styles.ratingEmpty} numberOfLines={1}>
              {t('reviews.noRatingsYet')}
            </AppText>
          </View>
          <View style={styles.ratingActions}>
            <View style={styles.rateBtn}>
              <Ionicons name="create-outline" size={16} color="#1a1405" style={styles.playIcon} />
              <AppText variant="label" style={styles.rateLabel}>
                {t('reviews.writeReview')}
              </AppText>
            </View>
            <View style={styles.seeAll}>
              <AppText variant="label" style={styles.seeAllLabel}>
                {t('reviews.seeAllReviews')}
              </AppText>
              <Ionicons name="chevron-forward" size={16} color={ACCENT_SOFT} />
            </View>
          </View>
        </View>

        {/* Track list — the app's standard row pattern (number column, title +
            artist line). Rows are visual-only until catalog audio is wired; the
            number column is where the playing indicator will live. */}
        <View style={styles.trackList}>
          {album.tracks.map((track, i) => (
            <View key={track.n} style={[styles.trackRow, i > 0 && styles.trackRowDivider]}>
              <View style={styles.trackIndex}>
                <AppText variant="body" color="textMuted">
                  {track.n}
                </AppText>
              </View>
              <View style={styles.trackMeta}>
                <AppText variant="h3" numberOfLines={1}>
                  {track.title}
                </AppText>
                <AppText variant="bodySm" color="textMuted" numberOfLines={1}>
                  Sung by the Angels
                </AppText>
              </View>
            </View>
          ))}
        </View>

        {/* Division rail (e.g. "Torah") — same design/behavior as the More-from
            rail below: preview tiles + "See All" into the division grid. */}
        <View style={styles.railSection}>
          <SectionHeader
            title={category.title}
            onSeeAll={
              divisionAlbums.length > 4
                ? () => navigation.navigate('CatalogCategory', { categoryId: category.id })
                : undefined
            }
          />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={divisionAlbums.slice(0, MAX_RAIL)}
            keyExtractor={(a) => a.code}
            contentContainerStyle={styles.railContent}
            ItemSeparatorComponent={() => <View style={styles.railSep} />}
            renderItem={({ item }) => (
              <CatalogTile
                album={item}
                onPress={() => navigation.push('CatalogAlbum', { code: item.code })}
              />
            )}
          />
        </View>

        {/* Sibling albums (same book, else same division). */}
        {moreAlbums.length ? (
          <View style={styles.railSection}>
            {/* "See All" appears in the header once the rail holds more than 4. */}
            <SectionHeader
              title={moreTitle}
              onSeeAll={
                moreAlbums.length > 4
                  ? () =>
                      navigation.navigate('CatalogCategory', {
                        categoryId: category.id,
                        ...(moreBook ? { book: moreBook } : {}),
                      })
                  : undefined
              }
            />
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={moreAlbums}
              keyExtractor={(a) => a.code}
              contentContainerStyle={styles.railContent}
              ItemSeparatorComponent={() => <View style={styles.railSep} />}
              renderItem={({ item }) => (
                <CatalogTile
                  album={item}
                  onPress={() => navigation.push('CatalogAlbum', { code: item.code })}
                />
              )}
            />
          </View>
        ) : null}
      </ScrollView>

      {/* Pinned black header with the back button. */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, height: insets.top + HEADER_HEIGHT }]}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
      </View>
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
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cover: {
    width: COVER_W,
    height: COVER_W,
    alignSelf: 'center',
    borderRadius: 14,
    backgroundColor: '#222',
  },
  celestial: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glyph: { fontSize: 120, lineHeight: 132 },
  headerBlock: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 18 },
  // Green genre pill matching the web album header: green border + text over
  // a subtle green-tinted fill.
  bookPill: {
    borderWidth: 1,
    borderColor: GENRE_GREEN,
    borderRadius: 999,
    backgroundColor: 'rgba(63,164,92,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  bookPillText: { letterSpacing: 0.8, color: GENRE_GREEN, fontWeight: '700' },
  title: { textAlign: 'center', color: INK },
  metaLine: { marginTop: 6, color: INK_MUTED, textAlign: 'center' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PADDING,
    marginTop: 18,
  },
  actionsSide: { flexDirection: 'row', alignItems: 'center' },
  actionGap: { marginLeft: 18 },
  playPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT_SOFT,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 24,
  },
  playIcon: { marginRight: 6 },
  playLabel: { color: '#1a1405', fontWeight: '800' },
  ratingCard: {
    marginHorizontal: H_PADDING,
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 16,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingEmpty: { flex: 1, marginLeft: 12 },
  ratingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT_SOFT,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  rateLabel: { color: '#1a1405', fontWeight: '800' },
  seeAll: { flexDirection: 'row', alignItems: 'center' },
  seeAllLabel: { color: ACCENT_SOFT },
  trackList: { paddingHorizontal: H_PADDING, paddingTop: 16 },
  // Mirrors the app's TrackRow layout (36pt index column, meta block).
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  trackRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  trackIndex: { width: 36, alignItems: 'center', justifyContent: 'center' },
  trackMeta: { flex: 1, marginLeft: 12, marginRight: 8 },
  railSection: { paddingTop: 28 },
  railContent: { paddingHorizontal: H_PADDING },
  railSep: { width: 14 },
});
