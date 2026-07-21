import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import type { ImageLoadEventData } from 'expo-image';
import { Artwork, CelestialArt } from '@/components/common';
import { catalogCover } from '@/content/angelsCatalog/covers';
import { catalogAlbumByCode } from '@/content/angelsCatalog/player';
import type { Track } from '@/types';

/**
 * Cover art for a playlist (or a catalog track row), resolved in three tiers.
 *
 * Angels' Catalog tracks carry `artwork: ''` (player.ts leaves the CDN cover
 * path unresolved) and the server's playlist `cover` is null on TorahSings —
 * the API derives it from a manifest this brand doesn't use. So neither of the
 * usual sources yields anything, and every playlist of catalog songs rendered a
 * bare placeholder. Resolve from the album code instead:
 *
 *   1. the bundled cover, for the albums that ship real art
 *   2. else the album's procedural celestial art (hue + Hebrew glyph), matching
 *      CatalogTile and the web's CelestialArt fallback
 *   3. else the normal CDN/server artwork, for manifest-sourced tracks
 *
 * `style` sizes the frame; the art fills it. Only tiers 1 and 3 fire `onLoad`
 * (celestial art is SVG and has no natural dimensions to report).
 */
export const PlaylistCover: React.FC<{
  /** The playlist's first item (or the row's track); its albumId is the code. */
  track?: Track;
  /** Server cover, already absolutized — used when the track isn't in the catalog. */
  fallbackUri?: string | null;
  /** Sizing + radius for the frame. */
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  onLoad?: (event: ImageLoadEventData) => void;
}> = ({ track, fallbackUri, style, iconSize, onLoad }) => {
  const code = track?.albumId ?? '';
  const bundled = code ? catalogCover(code) : undefined;
  const album = code ? catalogAlbumByCode(code) : undefined;

  return (
    <View style={[styles.frame, style]}>
      {bundled ? (
        <Artwork
          source={bundled}
          style={styles.fill}
          contentFit="cover"
          iconSize={iconSize}
          onLoad={onLoad}
        />
      ) : album ? (
        <CelestialArt
          seed={album.code}
          hue={album.hue}
          glyph={album.glyph ?? '✧'}
          style={styles.fill}
        />
      ) : (
        <Artwork
          uri={track?.artwork || fallbackUri || ''}
          style={styles.fill}
          contentFit="cover"
          iconSize={iconSize}
          onLoad={onLoad}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // overflow:hidden so a radius on `style` clips the art inside it.
  frame: { overflow: 'hidden', backgroundColor: '#222' },
  fill: { flex: 1 },
});
