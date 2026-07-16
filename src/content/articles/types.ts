// Types for the ported Hebraic Christianity articles (from TorahSings.com
// `lib/types.ts`). Trimmed to the article surface the mobile app renders.

/** A block of rich text. Article bodies are arrays of these. */
export type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'quote'; text: string; cite: string };

/** Celestial art seed — hue tints the panel, glyph is a Hebrew watermark. */
export interface Art {
  hue: number;
  glyph: string;
}

export const ARTICLE_CATEGORIES = [
  'The Names',
  'Feasts & Times',
  'Letters & Symbols',
  'Covenant',
  'The Ruach Kodesh',
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export interface Article {
  slug: string;
  title: string;
  /** Standfirst under the headline. */
  dek: string;
  category: ArticleCategory;
  presenter: string;
  readingTime: number;
  art: Art;
  blocks: Block[];
  audioUrl: string | null;
  /** Streams/reads free without a membership. */
  freeTier: boolean;
  /** At most one — leads the library as the large card. */
  featured?: boolean;
  releasedAt: string;
}
