/**
 * The auth panel's own palette, ported 1:1 from the web's
 * `src/app/signin/SignInForm.module.css`.
 *
 * These are deliberately NOT theme tokens. The website's auth page is a
 * warm-brown split screen that looks nothing like the near-black catalog behind
 * it, and the mobile flow matches that on purpose — so the colours live here
 * rather than polluting `theme/colors` with values only six screens can use.
 * Anything that DOES have a theme equivalent (body copy sizes, spacing) should
 * still come from `useTheme()`.
 */
export const authPalette = {
  /** `.panel` background — the warm brown the whole flow sits on. */
  panel: '#292622',
  /** `.panel` foreground. */
  text: '#f5f3ee',
  /** Muted body copy (`.check`, `.switch`). */
  textMuted: '#d3cdc1',
  /** Field labels (`.field label`). */
  label: '#cbc5b8',
  /** Placeholder text (`.field input::placeholder`). */
  placeholder: '#98917f',
  /** Footer copy (`.foot`). */
  footer: '#8a857b',

  /** The brand gold used for links, the wordmark's "Sings", checkbox accents. */
  gold: '#f0ad4e',
  /** `.field input` resting border. */
  fieldBorder: '#b78d4d',
  /** `.field input:focus` border. */
  fieldBorderFocus: '#ffc56b',
  /** The eye / calendar adornment icons. */
  adornment: '#e0b766',

  /** `.submit` gradient stops, top → bottom. */
  ctaGradient: ['#ffd27a', '#efab44'] as const,
  /** `.submit` label — near-black; white on gold is ~1.4:1 and unreadable. */
  ctaLabel: '#2a1c00',
  /** `.topbar` — the 4px strip pinned above everything. */
  topbarGradient: ['#e8a23e', '#ffd27a', '#e8a23e'] as const,

  /** `.info` banner. */
  infoBorder: '#1f9d57',
  infoBg: 'rgba(31,157,87,0.12)',
  infoText: '#bfe6cf',
  /** `.error` banner. */
  errorBorder: '#a4433a',
  errorBg: 'rgba(164,67,58,0.14)',
  errorText: '#f2c4bf',
  /** `.mismatch` inline warning. */
  mismatch: '#e94560',

  /** The `acctStyle` "you're signing in as…" row. */
  accountBorder: 'rgba(255,255,255,0.14)',
  accountBg: 'rgba(255,255,255,0.03)',

  /** Password-strength meter track + its four scored colours. */
  strengthTrack: 'rgba(255,255,255,0.12)',
  strength: ['#e94560', '#ff8a6b', '#feca57', '#4ac26b'] as const,

  /** The emphasised email inside the "Check your email" subtitle. */
  emphasis: '#feca57',
} as const;

/** `.inner { max-width: 380px }` — the form column's width cap. */
export const AUTH_CONTENT_WIDTH = 380;
