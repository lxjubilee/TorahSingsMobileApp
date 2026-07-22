import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/common';
import { CatalogCover } from '@/components/catalog';
import type { CatalogAlbum } from '@/content/angelsCatalog/types';

/**
 * One album tile: the album's CDN cover (with the bundled webp painted under it
 * while it loads), falling back to procedural celestial art for the albums whose
 * artwork isn't published yet. Shared by the Home rails, the full CatalogCategory
 * grid, and the album screen's "More from" rail. `onPress` opens the album (omit
 * for a static tile).
 */
export const CatalogTile: React.FC<{
  album: CatalogAlbum;
  width?: number;
  onPress?: () => void;
}> = ({ album, width = 150, onPress }) => {
  const square = { width, height: width };
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [{ width }, { opacity: pressed ? 0.8 : 1 }]}
    >
      <CatalogCover album={album} style={[styles.cover, square]} />
      <View style={styles.meta}>
        <AppText variant="h3" numberOfLines={2}>
          {album.title}
        </AppText>
        <AppText variant="body" color="textMuted" numberOfLines={1}>
          {album.book}
        </AppText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cover: { borderRadius: 10 },
  meta: { marginTop: 8 },
});
