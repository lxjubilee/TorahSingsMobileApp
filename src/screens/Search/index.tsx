import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context';
import { Screen, AppText, IconButton } from '@/components/common';
import { TrackRow } from '@/components/cards';
import { useAppDispatch, useAppSelector, usePlayer } from '@/hooks';
import { addRecentSearch, clearRecentSearches } from '@/redux';
import { usePlaylistMenu } from '@/components/playlists';
import { allCatalogAlbums, allCatalogTracks } from '@/content/angelsCatalog/player';
import type { CatalogAlbum } from '@/content/angelsCatalog/types';
import type { Track } from '@/types';
import { CatalogTile } from '../Home/components/CatalogTile';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ALBUM_TILE_W = 150;

// Cap search sections so a broad term (e.g. "the") doesn't render hundreds of rows.
const MAX_ALBUMS = 20;
const MAX_TRACKS = 30;

export const SearchScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { playTracks } = usePlayer();
  const { openTrackOptions } = usePlaylistMenu();

  const recent = useAppSelector((s) => s.search.recent);
  const [input, setInput] = useState('');

  const term = input.trim().toLowerCase();
  const hasQuery = term.length > 0;

  // Local, offline search over the bundled catalog: albums by title/book, songs
  // by track title. Recomputed only when the term changes.
  const { albums, tracks } = useMemo(() => {
    if (!term) return { albums: [] as CatalogAlbum[], tracks: [] as Track[] };
    return {
      albums: allCatalogAlbums
        .filter((a) => a.title.toLowerCase().includes(term) || a.book.toLowerCase().includes(term))
        .slice(0, MAX_ALBUMS),
      tracks: allCatalogTracks
        .filter((tk) => tk.title.toLowerCase().includes(term))
        .slice(0, MAX_TRACKS),
    };
  }, [term]);

  const hasResults = albums.length || tracks.length;

  return (
    <Screen>
      <View style={styles.headerWrap}>
        <AppText variant="display" style={styles.title}>
          {t('tabs.search')}
        </AppText>
        <View style={[styles.searchBox, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}>
          <Ionicons name="search" size={20} color={theme.colors.iconMuted} />
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => hasQuery && dispatch(addRecentSearch(input.trim()))}
            placeholder={t('search.placeholder')}
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.input, { color: theme.colors.text }]}
            returnKeyType="search"
            autoCorrect={false}
          />
          {hasQuery ? (
            <IconButton name="close-circle" size={20} color={theme.colors.iconMuted} onPress={() => setInput('')} />
          ) : null}
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        {!hasQuery ? (
          <View style={styles.recent}>
            <View style={styles.recentHeader}>
              <AppText variant="h2">{t('search.recent')}</AppText>
              {recent.length ? (
                <Pressable onPress={() => dispatch(clearRecentSearches())}>
                  <AppText variant="label" color="textMuted">
                    {t('search.clear')}
                  </AppText>
                </Pressable>
              ) : null}
            </View>
            {recent.map((rterm) => (
              <Pressable key={rterm} style={styles.recentRow} onPress={() => setInput(rterm)}>
                <Ionicons name="time-outline" size={20} color={theme.colors.iconMuted} />
                <AppText variant="body" style={styles.recentText}>
                  {rterm}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : !hasResults ? (
          <AppText variant="body" color="textMuted" style={styles.noResults}>
            {t('search.noResults', { query: input })}
          </AppText>
        ) : (
          <>
            {albums.length ? (
              <Section title={t('search.sectionAlbums')}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                  {albums.map((al) => (
                    <View key={al.code} style={styles.hItem}>
                      <CatalogTile
                        album={al}
                        width={ALBUM_TILE_W}
                        onPress={() => navigation.navigate('CatalogAlbum', { code: al.code })}
                      />
                    </View>
                  ))}
                </ScrollView>
              </Section>
            ) : null}

            {tracks.length ? (
              <Section title={t('search.sectionTracks')}>
                <View style={styles.tracks}>
                  {tracks.map((track) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      onPress={() => playTracks([track], 0)}
                      onOptions={openTrackOptions}
                    />
                  ))}
                </View>
              </Section>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <AppText variant="h2" style={styles.sectionTitle}>
      {title}
    </AppText>
    {children}
  </View>
);

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, paddingTop: 8 },
  title: { marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 46 },
  input: { flex: 1, marginLeft: 8, fontSize: 15 },
  scroll: { paddingBottom: 24, paddingTop: 8 },
  recent: { paddingHorizontal: 16, paddingTop: 8 },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  recentText: { marginLeft: 12 },
  noResults: { paddingHorizontal: 16, paddingTop: 24 },
  section: { marginTop: 20 },
  sectionTitle: { paddingHorizontal: 16, marginBottom: 12 },
  row: { paddingHorizontal: 16 },
  hItem: { marginRight: 14 },
  tracks: { paddingHorizontal: 16 },
});

export default SearchScreen;
