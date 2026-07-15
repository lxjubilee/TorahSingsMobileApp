import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context';
import { AlbumCard, ArtistCard } from '@/components/cards';
import { SectionHeader } from '@/components/common';
import { localizeTitle } from '@/localization';
import { Album, Artist, ResolvedRail } from '@/types';

interface RailProps {
  rail: ResolvedRail;
  onAlbumPress: (album: Album) => void;
  onArtistPress: (artist: Artist) => void;
  onSeeAll?: (rail: ResolvedRail) => void;
}

/** A single horizontally-scrolling Home row of albums or artists. */
export const Rail: React.FC<RailProps> = ({ rail, onAlbumPress, onArtistPress, onSeeAll }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  // Items are already artwork-filtered upstream (useVisibleRails); empty rails
  // are dropped there too, so these guards are just defensive.
  const albums = rail.albums ?? [];
  const artists = rail.artists ?? [];
  // Localize dynamic (config-driven) rail titles — genre and section names.
  // Unmapped titles (artist names, custom sections) fall back to the raw string.
  const title = localizeTitle(t, rail.title);

  if (rail.itemType === 'artist') {
    if (!artists.length) return null;
    return (
      <>
        <SectionHeader title={title} />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={artists}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
          ItemSeparatorComponent={() => <Sep />}
          renderItem={({ item }) => <ArtistCard artist={item} onPress={onArtistPress} />}
        />
      </>
    );
  }

  if (!albums.length) return null;
  // Show "See all" when there's a full list to open — an artist rail, or any
  // section with more than 10 albums. In the >10 case the horizontal row previews
  // the first 10 and "See all" opens the full grid.
  const MAX_PREVIEW = 10;
  const hasMore = albums.length > MAX_PREVIEW;
  const showSeeAll = !!rail.seeAllArtistId || hasMore;
  const preview = hasMore ? albums.slice(0, MAX_PREVIEW) : albums;
  return (
    <>
      <SectionHeader
        title={title}
        onSeeAll={showSeeAll ? () => onSeeAll?.(rail) : undefined}
      />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={preview}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
        ItemSeparatorComponent={() => <Sep />}
        renderItem={({ item }) => (
          <AlbumCard
            album={item}
            onPress={onAlbumPress}
            caption={rail.showGenre ? rail.genreByItem?.[item.id] : undefined}
          />
        )}
      />
    </>
  );
};

const Sep = () => <View style={styles.sep} />;

const styles = StyleSheet.create({
  sep: { width: 14 },
});
