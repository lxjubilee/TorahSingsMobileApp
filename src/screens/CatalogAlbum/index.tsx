import React, { useMemo } from 'react';
import { Dimensions, FlatList, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

// Web hero palette (globals.css) for continuity with the rest of the port.
const ACCENT_SOFT = '#ffd877';
const INK = '#f0ebe3';
const INK_MUTED = '#7f86a8';
const INK_BODY = '#b8bcd4';

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
          <AppText style={styles.eyebrow}>● {album.book.toUpperCase()}</AppText>
          <AppText variant="display" style={styles.title}>
            {album.title}
          </AppText>
          <AppText variant="bodySm" style={styles.metaLine}>
            Sung by the Angels · {album.tracks.length} {album.tracks.length === 1 ? 'song' : 'songs'} ·{' '}
            {category.title}
          </AppText>

          {/* PLAY ALBUM — visual only for now (audio not wired on mobile yet). */}
          <View style={styles.playButton}>
            <Ionicons name="play" size={18} color="#1a1405" style={styles.playIcon} />
            <AppText style={styles.playLabel}>PLAY ALBUM</AppText>
          </View>
        </View>

        {/* Track list. */}
        <View style={styles.trackList}>
          <View style={styles.trackListHeader}>
            <AppText style={styles.trackListHeaderText}>#</AppText>
            <AppText style={[styles.trackListHeaderText, styles.trackListHeaderTitle]}>TITLE</AppText>
          </View>
          {album.tracks.map((track) => (
            <View key={track.n} style={styles.trackRow}>
              {/* Per-track play — visual only for now. */}
              <View style={styles.trackPlay}>
                <Ionicons name="play" size={14} color={INK} />
              </View>
              <AppText variant="bodySm" color="textMuted" style={styles.trackNum}>
                {track.n}
              </AppText>
              <AppText variant="body" numberOfLines={2} style={styles.trackTitle}>
                {track.title}
              </AppText>
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
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: ACCENT_SOFT,
    marginBottom: 8,
  },
  title: { textAlign: 'center', color: INK },
  metaLine: { marginTop: 6, color: INK_MUTED, textAlign: 'center' },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT_SOFT,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  playIcon: { marginRight: 8 },
  playLabel: { color: '#1a1405', fontWeight: '800', letterSpacing: 1.2, fontSize: 13 },
  trackList: { paddingHorizontal: H_PADDING, paddingTop: 22 },
  trackListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.14)',
  },
  trackListHeaderText: {
    fontSize: 11,
    letterSpacing: 1.4,
    fontWeight: '700',
    color: INK_MUTED,
    width: 44,
    textAlign: 'center',
  },
  trackListHeaderTitle: { width: undefined, textAlign: 'left', marginLeft: 46 },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  trackPlay: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    // Optically center the triangular glyph.
    paddingLeft: 2,
  },
  trackNum: { width: 28, textAlign: 'center', marginRight: 10 },
  trackTitle: { flex: 1, color: INK_BODY },
  railSection: { paddingTop: 28 },
  railContent: { paddingHorizontal: H_PADDING },
  railSep: { width: 14 },
});
