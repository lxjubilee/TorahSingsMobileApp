import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/common';
import { GLYPH_BASE, GLYPH_BORDER, INK } from '../theme';

/**
 * Square hue-tinted glyph tile (spec §6.2): near-black base with a translucent
 * tint from the album hue, hairline border, and the Hebrew glyph at ~55% of
 * the tile. Used at 52pt in level rows and 96pt in the level-detail hero.
 */
export const GlyphTile: React.FC<{ glyph: string; hue: number; size: number }> = ({
  glyph,
  hue,
  size,
}) => (
  <View style={[styles.tile, { width: size, height: size }]}>
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: `hsla(${hue}, 60%, 60%, 0.18)` }]}
    />
    <AppText
      allowFontScaling={false}
      style={{ fontSize: Math.round(size * 0.55), lineHeight: Math.round(size * 0.7), color: INK }}
    >
      {glyph}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  tile: {
    borderRadius: 12,
    backgroundColor: GLYPH_BASE,
    borderWidth: 1,
    borderColor: GLYPH_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
