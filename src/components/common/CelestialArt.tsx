import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface CelestialArtProps {
  /** 0–360 hue that tints the panel + glyph. */
  hue: number;
  /** Hebrew watermark letter. */
  glyph: string;
  /** Glyph point size (defaults to a card-sized 64). */
  glyphSize?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Procedural "celestial" art panel — a hue-tinted field with a faint Hebrew
 * glyph watermark. Ported from the web CelestialArt for album/article covers
 * that have no image (so everything renders offline).
 */
export const CelestialArt: React.FC<CelestialArtProps> = ({ hue, glyph, glyphSize = 64, style }) => (
  <View style={[styles.base, { backgroundColor: `hsl(${hue}, 45%, 16%)` }, style]}>
    <Text
      allowFontScaling={false}
      style={{ fontSize: glyphSize, lineHeight: Math.round(glyphSize * 1.1), color: `hsla(${hue}, 72%, 78%, 0.5)` }}
    >
      {glyph}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
