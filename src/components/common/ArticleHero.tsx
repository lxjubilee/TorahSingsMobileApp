import React, { useEffect, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Image, ImageStyle } from 'expo-image';
import { cdnUrl } from '@/utils';
import { CelestialArt } from './CelestialArt';

interface ArticleHeroProps {
  /** Article slug — seeds the celestial fallback so it never shifts. */
  slug: string;
  /** CDN-relative hero image path. Absent (or 404) ⇒ celestial art. */
  uri?: string | null;
  /** Rendered in the fallback's faint caption. */
  topic?: string;
  /** Adds the elliptical ring to the fallback — for featured cards. */
  ring?: boolean;
  /** Sizing/radius style, applied identically to the image and the fallback. */
  style?: StyleProp<ImageStyle>;
}

const HEBREW = [...'אבגדהוזחטיכלמנסעפצקרשת'];

/** Stable hue/glyph for an article, so the fallback art is consistent per slug. */
function seedArt(slug: string): { hue: number; glyph: string } {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return { hue: h % 360, glyph: HEBREW[h % HEBREW.length] };
}

/**
 * An article's hero image, with the app's celestial art as the fallback.
 *
 * Deliberately not <Artwork>: that component reports failures into the album
 * artwork-missing store, which drives album list filtering. An article image is
 * unrelated to that, so a miss here must stay local to this component.
 */
export const ArticleHero: React.FC<ArticleHeroProps> = ({ slug, uri, topic, ring, style }) => {
  const resolved = uri ? cdnUrl(uri) : '';
  const [failed, setFailed] = useState(false);

  // Reset when the row is recycled onto a different article.
  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (!resolved || failed) {
    const { hue, glyph } = seedArt(slug);
    return (
      <CelestialArt
        seed={slug}
        hue={hue}
        topic={topic}
        glyph={glyph}
        ring={ring}
        // Same sizing/radius rules; the two style types differ only in `overflow`.
        style={style as StyleProp<ViewStyle>}
      />
    );
  }

  return (
    <Image
      source={{ uri: resolved }}
      style={style}
      contentFit="cover"
      transition={250}
      recyclingKey={resolved}
      onError={() => setFailed(true)}
    />
  );
};
