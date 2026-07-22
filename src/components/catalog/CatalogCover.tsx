import React, { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image, ImageContentFit, ImageLoadEventData, ImageStyle } from 'expo-image';
// Imported from the module, not the `common` barrel: the barrel also exports
// TrackArtwork, which imports this file — going through it would form a cycle.
import { CelestialArt } from '@/components/common/CelestialArt';
import {
  COVER_FORMATS,
  catalogCover,
  catalogCoverPath,
  isCoverMissing,
  markCoverMissing,
} from '@/content/angelsCatalog/covers';
import type { CatalogAlbum } from '@/content/angelsCatalog/types';
import { cdnUrl } from '@/utils';

interface CatalogCoverProps {
  album: CatalogAlbum;
  /** Sizes the frame (width/height/radius); the art fills it. */
  style?: StyleProp<ViewStyle>;
  contentFit?: ImageContentFit;
  /** Overrides the glyph size on the celestial fallback. */
  glyphSize?: number;
  /** Blurs the image (the now-playing backdrop). Celestial art is already soft,
   *  so it renders unblurred — behind a gradient the difference doesn't read. */
  blurRadius?: number;
  /** Fires with the CDN image's natural dimensions once it loads. */
  onLoad?: (event: ImageLoadEventData) => void;
}

/**
 * Cover art for one Angels'-Catalog album, resolved in three tiers:
 *
 *   1. the CDN cover (`torahsings/.../artwork/<CODE>.<ext>`) — the source of
 *      truth, so art uploaded to the bucket appears with no app release. webp is
 *      tried first and png only if that misses (see COVER_FORMATS);
 *   2. under it, the bundled webp as expo-image's `placeholder`, painted
 *      instantly while the CDN image streams in. Only the 14 albums in
 *      CATALOG_COVERS have one — the rest simply have no placeholder;
 *   3. once every format has missed, the bundled webp on its own if there is
 *      one, else celestial art (hue-tinted panel + Hebrew glyph) — which today
 *      is most of the catalog, since only 14 of 285 albums have art published.
 *
 * Each miss is remembered for the session (markCoverMissing) so re-renders and
 * sibling tiles skip the request rather than re-pulling a 27 KB error page.
 *
 * cachePolicy is left at expo-image's 'disk' default on purpose: at 1600x1600
 * these decode to ~9.8 MB of bitmap each whatever the transfer size, so holding
 * several in the memory cache would be worse than re-decoding from disk.
 */
export const CatalogCover: React.FC<CatalogCoverProps> = ({
  album,
  style,
  contentFit = 'cover',
  glyphSize,
  blurRadius,
  onLoad,
}) => {
  const placeholder = catalogCover(album.code);

  // Which format to try next. A cover is normally published as webp; png is
  // attempted only if that misses, so the common path costs one request.
  // `firstUntried` skips formats already known to 404 this session, so a
  // re-render (or a sibling tile) never repeats a miss.
  const firstUntried = (from = 0) =>
    COVER_FORMATS.findIndex((f, i) => i >= from && !isCoverMissing(catalogCoverPath(album, f)));
  const [attempt, setAttempt] = useState(firstUntried);

  // Reset when a recycled row swaps to another album.
  useEffect(() => {
    setAttempt(firstUntried());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album.code]);

  const path = attempt >= 0 ? catalogCoverPath(album, COVER_FORMATS[attempt]) : '';
  const failed = attempt < 0;

  // Session-scoped, so an offline launch that marks a cover it couldn't reach
  // re-attempts it on the next start rather than writing the miss off for good.
  const onError = () => {
    markCoverMissing(path);
    setAttempt(firstUntried(attempt + 1));
  };

  return (
    <View style={[styles.frame, style]}>
      {/* Underlay, always drawn: procedural and instant, so a tile is never a
          bare grey box while the CDN image travels — and it is already the
          resting state for the albums that have no cover published. */}
      <CelestialArt
        seed={album.code}
        hue={album.hue}
        glyph={album.glyph ?? '✧'}
        glyphSize={glyphSize}
        style={StyleSheet.absoluteFill}
      />

      {/* The bundled copy, if one is still shipped, outlives a failed fetch —
          offline, or if the object is pulled from the bucket. */}
      {failed && placeholder != null ? (
        <Image
          source={placeholder}
          style={StyleSheet.absoluteFill as ImageStyle}
          contentFit={contentFit}
          blurRadius={blurRadius}
          onLoad={onLoad}
        />
      ) : null}

      {!failed ? (
        <Image
          source={{ uri: cdnUrl(path) }}
          placeholder={placeholder}
          placeholderContentFit={contentFit}
          style={StyleSheet.absoluteFill as ImageStyle}
          contentFit={contentFit}
          recyclingKey={path}
          blurRadius={blurRadius}
          transition={200}
          onError={onError}
          onLoad={onLoad}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  // overflow:hidden so a radius on `style` clips the art inside it.
  frame: { overflow: 'hidden', backgroundColor: '#222' },
});
