import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/common';
import { catalogCover } from '@/content/angelsCatalog/covers';
import type { CatalogAlbum } from '@/content/angelsCatalog/types';

/**
 * One album tile: bundled cover art, or a procedural "celestial" placeholder
 * (hue-tinted panel + Hebrew glyph) matching the web's CelestialArt fallback.
 * Shared by the Home rails and the full CatalogCategory grid.
 */
export const CatalogTile: React.FC<{ album: CatalogAlbum; width?: number }> = ({
  album,
  width = 150,
}) => {
  const cover = catalogCover(album.code);
  const square = { width, height: width };
  return (
    <View style={{ width }}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  cover: { borderRadius: 10, backgroundColor: '#222' },
  celestial: { alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 58, lineHeight: 64 },
  meta: { marginTop: 8 },
});
