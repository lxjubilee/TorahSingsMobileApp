import React from 'react';
import { Dimensions, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CHIP_ROW_HEIGHT } from './HomeHeader';

const { width: W } = Dimensions.get('window');
// Slide-Zev.webp is a wide banner (1710×740). Fixed-height banner with the image
// pinned to the RIGHT (full image height, so Zev's face stays in frame); any
// horizontal crop trims the left backdrop, never Zev. Copy overlays the scrimmed
// left. Mirrors the web hero's background-position: right center.
const ASPECT = 1710 / 740;
const BANNER_H = 230;
const IMG_W = Math.round(BANNER_H * ASPECT);

// Ported verbatim from the web hero (TorahSings.com CatalogHero + globals.css).
const ACCENT_SOFT = '#ffd877'; // eyebrow (light gold)
const SCRIM = '#0a0e14'; // hero backdrop

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const MONO = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

/**
 * Static "Torah Sings" catalog hero — content ported from the web
 * (TorahSings.com CatalogHero): the Zev banner pinned to the right with the
 * serif title → italic subtitle overlaid on the scrimmed left, and the one-line
 * eyebrow strip pinned to the banner's bottom edge. Replaces the auto-rotating
 * album carousel on Home.
 */
export const HeroStatic: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 64 + CHIP_ROW_HEIGHT }]}>
      <View style={styles.banner}>
        {/* Zev pinned to the right — full image height, so his face stays visible. */}
        <Image
          source={require('../../../../assets/angels/art/Slide-Zev.webp')}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Left→right scrim so the copy stays readable while Zev shows on the right. */}
        <LinearGradient
          colors={[
            'rgba(10,14,20,0.85)',
            'rgba(10,14,20,0.75)',
            'rgba(10,14,20,0.4)',
            'rgba(10,14,20,0.08)',
            'rgba(10,14,20,0)',
          ]}
          locations={[0, 0.32, 0.6, 0.82, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.overlay}>
          <Text style={styles.title}>Torah Sings</Text>
          <Text style={styles.subtitle}>
            — the hidden songs of Scripture, decoded letter by letter and sung from heaven&rsquo;s own
            perspective.
          </Text>
        </View>

        {/* Bottom-left eyebrow strip — single line, pinned to the banner's bottom edge. */}
        <View style={styles.eyebrowBar}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            JUBILEE MINISTRIES · THE ANGELS&rsquo; CATALOG
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Bottom padding keeps the first rail from sitting flush against the banner
  // (the stats lede that used to live here provided that separation).
  container: { backgroundColor: SCRIM, paddingBottom: 16 },
  banner: {
    width: W,
    height: BANNER_H,
    backgroundColor: SCRIM,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  image: { position: 'absolute', right: 0, top: 0, height: BANNER_H, width: IMG_W },
  overlay: {
    paddingHorizontal: 20,
    // Keep the copy on the left half so it never runs over Zev on the right.
    maxWidth: '55%',
  },
  eyebrowBar: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 7,
    // Small bottom inset so the text sits a touch lower, near the banner edge.
    paddingBottom: 2,
  },
  eyebrow: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: ACCENT_SOFT,
    // No background bar — a dark text shadow keeps it readable over the image.
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  title: {
    fontFamily: SERIF,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 30,
    // Same light gold as the eyebrow strip.
    color: ACCENT_SOFT,
  },
  subtitle: {
    fontFamily: SERIF,
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 18,
    color: '#FFFFFF',
    marginTop: 6,
  },
});
