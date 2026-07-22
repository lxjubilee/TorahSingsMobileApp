import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import type { ImageLoadEventData } from 'expo-image';
import { Artwork } from './Artwork';
import { CatalogCover } from '@/components/catalog';
import { catalogAlbumByCode } from '@/content/angelsCatalog/player';
import type { Track } from '@/types';

/**
 * Cover art for any one `Track` — a row, a player surface, or a playlist card
 * standing in for its first item. Two tiers:
 *
 *   1. an Angels'-Catalog track (its `albumId` is the catalog code) → CatalogCover,
 *      the same CDN → bundled-webp → celestial resolution the rails and album
 *      screen use;
 *   2. else the plain `Artwork`, for manifest-sourced tracks, falling back to
 *      `fallbackUri` (a server-supplied playlist cover) when the track has none.
 *
 * Routing catalog tracks away from `Artwork` is not just cosmetic. `Artwork`
 * reports load failures to `markArtworkMissing`, which is PERSISTED and never
 * retried, and `useVisibleTracks` hides any track whose artwork is in that map.
 * Since most of the catalog has no cover published yet, sending catalog tracks
 * through `Artwork` would let one 404 permanently erase a liked catalog song
 * from Liked Songs. That filtering is correct for the manifest catalog and wrong
 * for this one, so the two paths stay separate.
 *
 * `style` sizes the frame; the art fills it. `onLoad` only fires when a real
 * image resolves — celestial art is SVG and has no natural dimensions to report.
 */
export const TrackArtwork: React.FC<{
  /** The track (or a playlist's first item); its albumId is the catalog code. */
  track?: Track;
  /** Server cover, already absolutized — used when the track isn't in the catalog. */
  fallbackUri?: string | null;
  /** Sizing + radius for the frame. */
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  /** Blurs the art — the now-playing backdrop. */
  blurRadius?: number;
  /** Fade-in duration for the image, in ms. */
  transition?: number;
  onLoad?: (event: ImageLoadEventData) => void;
}> = ({ track, fallbackUri, style, iconSize, blurRadius, transition, onLoad }) => {
  const code = track?.albumId ?? '';
  const album = code ? catalogAlbumByCode(code) : undefined;

  // CatalogCover brings its own frame, so it replaces the wrapper, not nests in it.
  if (album) {
    return (
      <CatalogCover
        album={album}
        style={[styles.frame, style]}
        blurRadius={blurRadius}
        onLoad={onLoad}
      />
    );
  }

  return (
    <View style={[styles.frame, style]}>
      <Artwork
        uri={track?.artwork || fallbackUri || ''}
        style={styles.fill}
        contentFit="cover"
        iconSize={iconSize}
        blurRadius={blurRadius}
        transition={transition}
        onLoad={onLoad}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // overflow:hidden so a radius on `style` clips the art inside it.
  frame: { overflow: 'hidden', backgroundColor: '#222' },
  fill: { flex: 1 },
});
