import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/common';
import { catalogCover } from '@/content/angelsCatalog/covers';
import type { CatalogAlbum } from '@/content/angelsCatalog/types';

/**
 * One album tile: bundled cover art, or a procedural "celestial" placeholder
 * (hue-tinted panel + Hebrew glyph) matching the web's CelestialArt fallback.
 * Shared by the Home rails, the full CatalogCategory grid, and the album
 * screen's "More from" rail. `onPress` opens the album (omit for a static tile).
 */
export const CatalogTile: React.FC<{
  album: CatalogAlbum;
  width?: number;
  onPress?: () => void;
}> = ({ album, width = 150, onPress }) => {
  const cover = catalogCover(album.code);
  const square = { width, height: width };
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [{ width }, { opacity: pressed ? 0.8 : 1 }]}
    >
      {cover ? (
        <Image source={cover} style={[styles.cover, square]} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.celestial, square, { backgroundColor: `hsl(${album.hue}, 45%, 18%)` }]}>
          <AppText style={[styles.glyph, { color: `hsla(${album.hue}, 70%, 78%, 0.55)` }]}>
            {album.glyph ?? '✧'}
          </AppText>
        </View>
      )}
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
  cover: { borderRadius: 10, backgroundColor: '#222' },
  celestial: { alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 58, lineHeight: 64 },
  meta: { marginTop: 8 },
});
