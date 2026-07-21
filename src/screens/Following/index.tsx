import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Screen, Loader, AppText, Placeholder, IconButton } from '@/components/common';
import { AlbumCard, ArtistCard } from '@/components/cards';
import { useAppSelector, useVisibleAlbums, useVisibleArtists } from '@/hooks';
import { getCatalogIndex } from '@/services/catalog';
import { catalogAlbumByCode } from '@/content/angelsCatalog/player';
import type { CatalogAlbum } from '@/content/angelsCatalog/types';
import { Album, Artist } from '@/types';
import { CatalogTile } from '../Home/components/CatalogTile';
import type { PlaylistsStackParamList, RootStackParamList } from '@/navigation/types';

// Pushes within the Playlists stack; opens album/artist details on the root stack.
type Nav = NativeStackNavigationProp<PlaylistsStackParamList & RootStackParamList>;
const { width } = Dimensions.get('window');
const COL_W = (width - 48) / 2;

/**
 * Everything the user follows — albums first, then artists. Reached from the
 * Profile "Following" shortcut.
 *
 * Follows are stored as ids only (see librarySlice) and are device-local: there
 * is no backend follow endpoint on either platform. They ARE persisted, so
 * unlike the web's Follow button they survive a restart.
 *
 * Album ids resolve two different ways, because the Angels' Catalog is not in
 * the manifest: manifest albums come from the catalog index, bundled catalog
 * albums from `catalogAlbumByCode`. Each opens its own screen. Ids that resolve
 * to neither are dropped.
 */
export const FollowingScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  const followedArtistIds = useAppSelector((s) => s.library.followedArtistIds);
  const followedAlbumIds = useAppSelector((s) => s.library.followedAlbumIds);
  const [index, setIndex] = useState<{
    artistsById: Map<string, Artist>;
    albumsById: Map<string, Album>;
  } | null>(null);

  useEffect(() => {
    let active = true;
    getCatalogIndex()
      .then((ix) => active && setIndex({ artistsById: ix.artistsById, albumsById: ix.albumsById }))
      .catch(() => active && setIndex({ artistsById: new Map(), albumsById: new Map() }));
    return () => {
      active = false;
    };
  }, []);

  // Manifest albums and bundled catalog albums are kept apart: they render with
  // different cards and navigate to different screens.
  const { manifestAlbums, catalogAlbums } = useMemo(() => {
    const manifest: Album[] = [];
    const catalog: CatalogAlbum[] = [];
    if (!index) return { manifestAlbums: manifest, catalogAlbums: catalog };
    for (const id of followedAlbumIds) {
      const album = index.albumsById.get(id);
      if (album) {
        manifest.push(album);
        continue;
      }
      const cat = catalogAlbumByCode(id);
      if (cat) catalog.push(cat);
    }
    return { manifestAlbums: manifest, catalogAlbums: catalog };
  }, [index, followedAlbumIds]);

  const followedArtists = useMemo(
    () =>
      index
        ? followedArtistIds
            .map((id) => index.artistsById.get(id))
            .filter((a): a is Artist => a != null)
        : [],
    [index, followedArtistIds],
  );

  // Personal collection — never hidden by the active catalog language.
  const albums = useVisibleAlbums(manifestAlbums, { filterByLanguage: false });
  const artists = useVisibleArtists(followedArtists, { filterByLanguage: false });

  const isEmpty = !albums.length && !catalogAlbums.length && !artists.length;

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <AppText variant="h1">{t('library.following')}</AppText>
      </View>

      {index == null ? (
        <Loader />
      ) : isEmpty ? (
        <Placeholder
          icon="add-circle-outline"
          title={t('library.following')}
          subtitle={t('library.emptyFollowing')}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {albums.length || catalogAlbums.length ? (
            <View style={styles.section}>
              <AppText variant="h2" style={styles.sectionTitle}>
                {t('library.albums')}
              </AppText>
              <View style={styles.grid}>
                {catalogAlbums.map((album) => (
                  <CatalogTile
                    key={album.code}
                    album={album}
                    width={COL_W}
                    onPress={() => navigation.navigate('CatalogAlbum', { code: album.code })}
                  />
                ))}
                {albums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    width={COL_W}
                    onPress={(al) => navigation.navigate('AlbumDetails', { albumId: al.id })}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {artists.length ? (
            <View style={styles.section}>
              <AppText variant="h2" style={styles.sectionTitle}>
                {t('library.artists')}
              </AppText>
              <View style={styles.grid}>
                {artists.map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    size={COL_W}
                    onPress={(ar) => navigation.navigate('ArtistDetails', { artistId: ar.id })}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingTop: 8 },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  section: { marginTop: 8, marginBottom: 16 },
  sectionTitle: { marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
});

export default FollowingScreen;
