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
const INK = '#f0ebe3'; // title / emphasis (warm white)
const INK_MUTED = '#7f86a8'; // italic subtitle
const INK_BODY = '#b8bcd4'; // lede body
const SCRIM = '#0a0e14'; // hero backdrop

// Counts come from the web catalog (auto-generated angels-catalog.ts header:
// "285 albums · 303 tracks"). Kept in sync with TorahSings.com.
const TOTAL_ALBUMS = '285';
const TOTAL_SONGS = '303';

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const MONO = Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' });

/**
 * Static "Torah Sings" catalog hero — content ported from the web
 * (TorahSings.com CatalogHero): the Zev banner pinned to the right with the
 * eyebrow → serif title → italic subtitle overlaid on the scrimmed left, and the
 * stats line just below. Replaces the auto-rotating album carousel on Home.
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
            'rgba(10,14,20,0.96)',
            'rgba(10,14,20,0.9)',
            'rgba(10,14,20,0.55)',
            'rgba(10,14,20,0.12)',
            'rgba(10,14,20,0)',
          ]}
          locations={[0, 0.32, 0.6, 0.82, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.overlay}>
          <Text style={styles.eyebrow}>JUBILEE MINISTRIES ·{'\n'}THE ANGELS&rsquo; CATALOG</Text>
          <Text style={styles.title}>Torah Sings</Text>
          <Text style={styles.subtitle}>
            — the hidden songs of Scripture, decoded letter by letter and sung from heaven&rsquo;s own
            perspective.
          </Text>
        </View>
      </View>

      <View style={styles.copyBelow}>
        <Text style={styles.lede}>
          <Text style={styles.ledeStrong}>{TOTAL_ALBUMS} albums.</Text> {TOTAL_SONGS} songs. Across
          the Torah, the Prophets, and the Writings — press play, and the music keeps going as you
          move through the site.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: SCRIM },
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
  eyebrow: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '700',
    color: ACCENT_SOFT,
    marginBottom: 8,
  },
  title: {
    fontFamily: SERIF,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 30,
    color: INK,
  },
  subtitle: {
    fontFamily: SERIF,
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 18,
    color: INK_MUTED,
    marginTop: 6,
  },
  copyBelow: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20 },
  lede: { fontSize: 13, lineHeight: 20, color: INK_BODY },
  ledeStrong: { color: INK, fontWeight: '700' },
});
