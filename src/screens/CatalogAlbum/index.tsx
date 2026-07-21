import React, { useMemo, useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AlbumRatingSummary, ReviewComposer, SongRatingControl } from '@/components/reviews';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, AppText, IconButton, SectionHeader } from '@/components/common';
import { FloatingMiniPlayer } from '@/components/player';
import { usePlaylistMenu } from '@/components/playlists';
import { angelsCatalog } from '@/content/angelsCatalog/data';
import { catalogCover } from '@/content/angelsCatalog/covers';
import { albumToPlayerTracks, catalogTrackId } from '@/content/angelsCatalog/player';
import type { CatalogAlbum, CatalogCategory, CatalogTrack } from '@/content/angelsCatalog/types';
import {
  useAppDispatch,
  useAppSelector,
  useIsAlbumLiked,
  useIsSongLiked,
  usePlayer,
  useReviews,
  useSongSummaries,
  useTrackDuration,
} from '@/hooks';
import { toggleAlbumLike, toggleSongLike } from '@/redux';
import { albumUuid, trackSongUuid } from '@/services/playlists';
import type { MyReview, ReviewTargetType, Track } from '@/types';
import { formatDuration, shuffle } from '@/utils';
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
 * Play / shuffle / a tapped track stream the CDN audio through the shared
 * playback engine (usePlayer -> trackAdapter -> cdnUrl).
 */
export const CatalogAlbumScreen: React.FC = () => {
  const { params } = useRoute<RootStackScreenProps<'CatalogAlbum'>['route']>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { playTracks, playFrom, toggle, currentTrack, isPlaying } = usePlayer();
  const { addToPlaylist, addAlbumToPlaylist } = usePlaylistMenu();
  const dispatch = useAppDispatch();

  const found = useMemo(() => findAlbum(params.code), [params.code]);

  // Player-ready tracks for this album (CDN-relative urls; empty when missing).
  const tracks = useMemo(
    () => (found ? albumToPlayerTracks(found.album) : []),
    [found],
  );

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

  // Ratings: the reviews API keys by the backend's deterministic uuids, while
  // the catalog uses codes — so convert album code -> albumUuid and each track ->
  // its song uuid (the same scheme playlists use). See songId.ts. These hooks sit
  // above the `!found` return so they always run; `useReviews` no-ops on an
  // undefined id.
  const albumTargetId = useMemo(
    () => (found ? albumUuid(found.album.code) : undefined),
    [found],
  );
  const { summary: albumSummary, applySummary: applyAlbumSummary } = useReviews(
    'album',
    albumTargetId,
  );
  // Above the `!found` return so the hook order stays stable; an empty code just
  // yields a key nothing is stored under.
  const albumLiked = useIsAlbumLiked({ id: found?.album.code ?? '' });

  // Flips the add-to-playlist glyph to "check" once every track is in some
  // playlist (mirrors AlbumDetails). `membership` is kept fresh by the
  // playlists slice, so this survives leaving and returning to the screen.
  const membership = useAppSelector((s) => s.playlists.membership);
  const albumInPlaylist = useMemo(() => {
    const ids = tracks.map((tr) => trackSongUuid(tr)).filter((x): x is string => !!x);
    return ids.length > 0 && ids.every((id) => (membership[id] ?? 0) > 0);
  }, [tracks, membership]);
  const songTargets = useMemo(
    () =>
      tracks
        .map((tr) => ({ localId: tr.id, targetId: trackSongUuid(tr) }))
        .filter((s): s is { localId: string; targetId: string } => s.targetId != null),
    [tracks],
  );
  const { summaries: songSummaries, applyOne: applySongSummary } = useSongSummaries(songTargets);
  const [composer, setComposer] = useState<{
    type: ReviewTargetType;
    targetId: string; // uuid sent to the API
    localId?: string; // local Track.id, for keying the per-song summary
    label: string;
    initial: MyReview | null;
  } | null>(null);

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

  // Whether a track from THIS album is loaded in the player, and whether it's
  // currently playing — drives the Play/Pause toggle on the album pill.
  const albumIsActive = currentTrack?.albumId === album.code;
  const albumIsPlaying = albumIsActive && isPlaying;

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
            shuffle / Play). The heart is server-backed like AlbumDetails': the
            catalog code IS the Album.id space albumUuid() hashes, so the same
            deterministic uuid reaches /api/me/likes. Share is still visual-only. */}
        <View style={styles.actions}>
          <View style={styles.actionsSide}>
            <IconButton
              name={albumLiked ? 'heart' : 'heart-outline'}
              size={28}
              color={albumLiked ? ACCENT_SOFT : undefined}
              onPress={() => dispatch(toggleAlbumLike({ id: album.code }))}
            />
            <IconButton name="share-outline" size={26} style={styles.actionGap} />
            <Pressable
              onPress={() => addAlbumToPlaylist(tracks)}
              hitSlop={10}
              disabled={!tracks.length}
              style={[styles.actionGap, { opacity: tracks.length ? 1 : 0.4 }]}
              accessibilityRole="button"
              accessibilityLabel={
                albumInPlaylist ? t('playlist.inPlaylist') : t('playlist.addToPlaylist')
              }
            >
              <MaterialCommunityIcons
                name={albumInPlaylist ? 'playlist-check' : 'playlist-plus'}
                size={28}
                color={albumInPlaylist ? ACCENT_SOFT : '#FFFFFF'}
              />
            </Pressable>
          </View>
          <View style={styles.actionsSide}>
            <IconButton
              name="shuffle"
              size={26}
              onPress={tracks.length ? () => playTracks(shuffle(tracks), 0) : undefined}
            />
            <Pressable
              style={[styles.playPill, styles.actionGap]}
              onPress={
                tracks.length
                  ? albumIsActive
                    ? () => toggle()
                    : () => playTracks(tracks, 0)
                  : undefined
              }
            >
              <Ionicons
                name={albumIsPlaying ? 'pause' : 'play'}
                size={18}
                color="#1a1405"
                style={styles.playIcon}
              />
              <AppText variant="label" style={styles.playLabel}>
                {t(albumIsPlaying ? 'common.pause' : 'common.play')}
              </AppText>
            </Pressable>
          </View>
        </View>

        {/* Rating summary. Target uuids are derived from the album code and never
            stored server-side, which is why these catalog albums are rateable
            even though the catalog table is empty — same as the web. */}
        <AlbumRatingSummary
          summary={albumSummary}
          targetId={albumTargetId}
          onApplySummary={applyAlbumSummary}
          onRate={() =>
            albumTargetId &&
            setComposer({
              type: 'album',
              targetId: albumTargetId,
              label: album.title,
              initial: albumSummary?.mine ?? null,
            })
          }
          onSeeAll={() =>
            navigation.navigate('AlbumReviews', { albumId: album.code, albumTitle: album.title })
          }
        />

        {/* Track list — the app's standard row pattern (number column, title +
            artist line). The number column carries the playing indicator. */}
        <View style={styles.trackList}>
          {album.tracks.map((track, i) => {
            const playerTrack = tracks[i];
            // Keyed by the local track id, not `n`: the source data repeats track
            // numbers (see player.ts), so two rows can share one server target.
            const localId = playerTrack?.id;
            const songTargetId = playerTrack ? trackSongUuid(playerTrack) : null;
            return (
              <CatalogTrackRow
                key={i}
                track={track}
                playerTrack={playerTrack}
                showDivider={i > 0}
                isCurrent={currentTrack?.id === catalogTrackId(album.code, i)}
                onPlay={() => playFrom(tracks, catalogTrackId(album.code, i))}
                onAddToPlaylist={() => addToPlaylist(playerTrack)}
                ratingSlot={
                  songTargetId && localId ? (
                    <SongRatingControl
                      summary={songSummaries[localId]}
                      targetId={songTargetId}
                      onApplySummary={(s) => applySongSummary(localId, s)}
                      onRate={() =>
                        setComposer({
                          type: 'song',
                          targetId: songTargetId,
                          localId,
                          label: track.title,
                          initial: songSummaries[localId]?.mine ?? null,
                        })
                      }
                    />
                  ) : null
                }
              />
            );
          })}
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

      {/* Persistent now-playing bar — the tab-bar mini-player is hidden while
          this root-stack screen is open; taps through to the MusicPlayer. */}
      <FloatingMiniPlayer />

      {composer ? (
        <ReviewComposer
          type={composer.type}
          id={composer.targetId}
          targetLabel={composer.label}
          initial={composer.initial}
          onClose={() => setComposer(null)}
          onSaved={(summary, mine) =>
            composer.type === 'album'
              ? applyAlbumSummary({ ...summary, mine })
              : applySongSummary(composer.localId!, { ...summary, mine })
          }
          onDeleted={(summary) =>
            composer.type === 'album'
              ? applyAlbumSummary(summary)
              : applySongSummary(composer.localId!, summary)
          }
        />
      ) : null}
    </Screen>
  );
};

/**
 * One track row: index / now-playing indicator, title + "Sung by the Angels" +
 * the rating slot, and trailing heart · add-to-playlist · duration. The duration
 * is resolved lazily from the audio header (catalog tracks ship none); the heart
 * is server-backed via /api/me/likes (the catalog track's albumId + trackNumber
 * hash to the same song uuid playlists use), while add-to-playlist opens the
 * app's real playlist picker.
 */
type CatalogTrackRowProps = {
  track: CatalogTrack;
  playerTrack: Track;
  showDivider: boolean;
  isCurrent: boolean;
  onPlay: () => void;
  onAddToPlaylist: () => void;
  /** Per-song rating control, injected by the screen (mirrors TrackRow). */
  ratingSlot?: React.ReactNode;
};

// Declared as a hoisted function (not a `const` arrow) so it's in scope where
// the track list references it above — matches the rest of the screens.
function CatalogTrackRow({ track, playerTrack, showDivider, isCurrent, onPlay, onAddToPlaylist, ratingSlot }: CatalogTrackRowProps) {
  const dispatch = useAppDispatch();
  const liked = useIsSongLiked(playerTrack);
  const duration = useTrackDuration(playerTrack);

  return (
    <Pressable style={[styles.trackRow, showDivider && styles.trackRowDivider]} onPress={onPlay}>
      <View style={styles.trackIndex}>
        {isCurrent ? (
          <Ionicons name="volume-medium" size={18} color={ACCENT_SOFT} />
        ) : (
          <AppText variant="body" color="textMuted">
            {track.n}
          </AppText>
        )}
      </View>

      <View style={styles.trackMeta}>
        <AppText variant="h3" numberOfLines={1} style={isCurrent ? styles.trackTitleActive : undefined}>
          {track.title}
        </AppText>
        <AppText variant="bodySm" color="textMuted" numberOfLines={1}>
          Sung by the Angels
        </AppText>
        {ratingSlot ? <View style={styles.trackRating}>{ratingSlot}</View> : null}
      </View>

      <View style={styles.trackActions}>
        <IconButton
          name={liked ? 'heart' : 'heart-outline'}
          size={20}
          color={liked ? ACCENT_SOFT : INK_MUTED}
          onPress={() => dispatch(toggleSongLike(playerTrack))}
          style={styles.trackAction}
        />
        <IconButton
          name="add-circle-outline"
          size={22}
          color={INK_MUTED}
          onPress={onAddToPlaylist}
          style={styles.trackAction}
        />
        {duration > 0 ? (
          <AppText variant="caption" color="textMuted" style={styles.trackDuration}>
            {formatDuration(duration)}
          </AppText>
        ) : (
          <View style={styles.trackDurationSkeleton} />
        )}
      </View>
    </Pressable>
  );
}

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
  trackList: { paddingHorizontal: H_PADDING, paddingTop: 16 },
  // Mirrors the app's TrackRow layout (36pt index column, meta block).
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  trackRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  trackIndex: { width: 36, alignItems: 'center', justifyContent: 'center' },
  trackTitleActive: { color: ACCENT_SOFT },
  trackMeta: { flex: 1, marginLeft: 12, marginRight: 8 },
  trackRating: { marginTop: 6 },
  trackActions: { flexDirection: 'row', alignItems: 'center' },
  trackAction: { marginHorizontal: 2 },
  trackDuration: { minWidth: 34, marginLeft: 4, textAlign: 'right' },
  trackDurationSkeleton: {
    width: 30,
    height: 10,
    borderRadius: 4,
    marginLeft: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  railSection: { paddingTop: 28 },
  railContent: { paddingHorizontal: H_PADDING },
  railSep: { width: 14 },
});
