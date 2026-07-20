import React, { useState } from 'react';
import { LayoutChangeEvent, Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Rect, Stop } from 'react-native-svg';
import { starsFor } from '@/utils';

interface CelestialArtProps {
  /** Seeds the star scatter. Use the album/article slug so it never shifts. */
  seed: string;
  /** 0–360 hue that tints the whole panel. */
  hue: number;
  /** Rendered as "celestial art · [topic]" in a faint mono caption. */
  topic?: string;
  /** A single Hebrew letter, faint, bottom-right. */
  glyph?: string;
  /** Overrides the container-relative glyph size. */
  glyphSize?: number;
  /** Adds the thin elliptical ring — for the featured hero orb. */
  ring?: boolean;
  style?: StyleProp<ViewStyle>;
}

const STAR = 'rgb(232,217,168)';

/**
 * The celestial art placeholder, ported layer-for-layer from the web's
 * `CelestialArt` (hue-tinted glow, seeded stars, soft orb, glyph watermark,
 * mono caption). The web draws it in CSS; there is no source image to load, so
 * this redraws the same composite in SVG and everything still renders offline.
 *
 * Geometry is measured rather than percentage-based because the orb is a true
 * circle sized off the container WIDTH — it would skew under a viewBox.
 */
export const CelestialArt: React.FC<CelestialArtProps> = ({
  seed,
  hue,
  topic,
  glyph,
  glyphSize,
  ring = false,
  style,
}) => {
  const [{ w, h }, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== w || height !== h) setSize({ w: width, h: height });
  };

  // (c) the orb: 46% of the container width, a true circle, 22% down.
  const orb = 0.46 * w;
  const orbR = orb / 2;
  const orbCx = 0.5 * w;
  const orbCy = 0.22 * h + orbR;
  // CSS `circle at 38% 34%` — the gradient centre sits off the orb's own centre,
  // with a farthest-corner radius, which is what gives the sphere its lit side.
  const litX = orbCx - orbR + 0.38 * orb;
  const litY = orbCy - orbR + 0.34 * orb;

  const ringW = 0.68 * w;
  const glyphPx = glyphSize ?? Math.min(144, Math.max(56, 0.22 * w));

  return (
    <View style={[styles.base, style]} onLayout={onLayout}>
      {w > 0 && h > 0 ? (
        <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
          <Defs>
            {/* (a) hue-tinted glow from the top, and a dimmer one from the bottom. */}
            <RadialGradient id="glowTop" cx={0.5 * w} cy={0} rx={1.2 * w} ry={0.78 * h} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={`hsl(${hue}, 68%, 62%)`} stopOpacity={0.24} />
              <Stop offset="0.62" stopColor={`hsl(${hue}, 68%, 62%)`} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="glowBot" cx={0.5 * w} cy={h} rx={0.9 * w} ry={0.6 * h} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={`hsl(${hue}, 60%, 30%)`} stopOpacity={0.16} />
              <Stop offset="0.7" stopColor={`hsl(${hue}, 60%, 30%)`} stopOpacity={0} />
            </RadialGradient>

            {/* (c) the orb body, and the soft halo the web gets from `blur(14px)`. */}
            <RadialGradient id="orb" cx={litX} cy={litY} r={0.906 * orb} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={`hsl(${hue}, 88%, 92%)`} stopOpacity={0.95} />
              <Stop offset="0.38" stopColor={`hsl(${hue}, 74%, 62%)`} stopOpacity={0.55} />
              <Stop offset="0.68" stopColor={`hsl(${hue}, 62%, 28%)`} stopOpacity={0.18} />
              <Stop offset="0.74" stopColor={`hsl(${hue}, 62%, 28%)`} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="halo" cx={orbCx} cy={orbCy} r={0.68 * orb} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={`hsl(${hue}, 80%, 70%)`} stopOpacity={0.22} />
              <Stop offset="0.62" stopColor={`hsl(${hue}, 80%, 70%)`} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          <Rect x={0} y={0} width={w} height={h} fill="#05070f" />
          <Rect x={0} y={0} width={w} height={h} fill="url(#glowTop)" />
          <Rect x={0} y={0} width={w} height={h} fill="url(#glowBot)" />

          {/* (b) 3–5 tiny star dots, seeded off the slug. */}
          {starsFor(seed).map((s, i) => (
            <Circle
              key={i}
              cx={(s.x / 100) * w}
              cy={(s.y / 100) * h}
              r={s.size}
              fill={STAR}
              fillOpacity={s.opacity}
            />
          ))}

          {ring ? (
            <Ellipse
              cx={orbCx}
              cy={0.22 * h + ringW / 2}
              rx={ringW / 2}
              ry={(ringW / 2) * 0.34}
              stroke={`hsl(${hue}, 60%, 78%)`}
              strokeOpacity={0.22}
              strokeWidth={1}
              fill="none"
              transform={`rotate(-14, ${orbCx}, ${0.22 * h + ringW / 2})`}
            />
          ) : null}

          <Circle cx={orbCx} cy={orbCy} r={0.68 * orb} fill="url(#halo)" />
          <Circle cx={orbCx} cy={orbCy} r={orbR} fill="url(#orb)" />
        </Svg>
      ) : null}

      {/* Hebrew watermark — barely there, bottom-right. */}
      {glyph ? (
        <Text
          allowFontScaling={false}
          style={[
            styles.watermark,
            {
              right: 0.06 * w,
              bottom: 0.04 * h,
              fontSize: glyphPx,
              lineHeight: Math.round(glyphPx * 1.1),
              color: `hsla(${hue}, 40%, 88%, 0.07)`,
            },
          ]}
        >
          {glyph}
        </Text>
      ) : null}

      {topic ? (
        <Text allowFontScaling={false} style={styles.caption}>
          celestial art · {topic.toLowerCase()}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  base: { overflow: 'hidden', backgroundColor: '#05070f' },
  watermark: { position: 'absolute' },
  caption: {
    position: 'absolute',
    left: 14,
    bottom: 12,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 9.5,
    letterSpacing: 2.1,
    color: 'rgba(232,217,168,0.3)',
  },
});
