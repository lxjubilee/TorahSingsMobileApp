/**
 * Color tokens. Dark theme is the default and only theme shipped now, but the
 * shape is a palette object so a `lightColors` sibling can be added later and
 * selected by the ThemeProvider without touching any component.
 */
export interface ColorPalette {
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  primary: string;
  primaryMuted: string;
  accent: string;
  /** Foreground for content sitting ON `accent` (which is light — white fails). */
  onAccent: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  icon: string;
  iconMuted: string;
  success: string;
  danger: string;
  overlay: string;
  tabBar: string;
  miniPlayer: string;
  skeleton: string;
}

export const darkColors: ColorPalette = {
  background: '#0B0B0F',
  backgroundElevated: '#15151C',
  surface: '#1C1C26',
  surfaceAlt: '#26263340',
  border: '#2A2A36',
  primary: '#7C4DFF', // Jubilujah purple accent
  primaryMuted: '#4A2FA0',
  // Light gold — play CTAs & now-playing highlight. Matches the ACCENT_SOFT
  // constant already used for eyebrows, the liked heart and the now-playing
  // indicator across the catalog/article screens.
  accent: '#ffd877',
  // Near-black on gold reads ~13:1; white on gold is ~1.4:1 and unreadable, so
  // filled accent buttons must use this rather than '#FFFFFF'.
  onAccent: '#0B0B0F',
  text: '#FFFFFF',
  textSecondary: '#C7C7D1',
  textMuted: '#8A8A99',
  icon: '#FFFFFF',
  iconMuted: '#8A8A99',
  success: '#1DB954',
  danger: '#FF4D5E',
  overlay: 'rgba(0,0,0,0.6)',
  tabBar: '#0E0E14',
  miniPlayer: '#1A1A24',
  skeleton: '#22222E',
};

export type ThemeColors = ColorPalette;
