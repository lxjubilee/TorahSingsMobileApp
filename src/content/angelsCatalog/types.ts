// Types for the ported Angels' Catalog data (from TorahSings.com `lib/angels.ts`).
// Trimmed to what the mobile app renders — no web-only media helpers.

export interface CatalogTrack {
  n: number;
  title: string;
  /** Path relative to the angels music root, forward-slashed. */
  rel: string;
}

export interface CatalogAlbum {
  /** Album code, e.g. "ANSMX01001EN" — also the cover-map key. */
  code: string;
  title: string;
  /** Source book, e.g. "Genesis". */
  book: string;
  /** 1–66. */
  bookNum: number;
  /** 0–360, seeds the celestial-art hue for albums without cover art. */
  hue: number;
  /** A Hebrew watermark letter for the celestial-art placeholder. */
  glyph?: string;
  /** Web cover URL (informational here); the mobile tile resolves bundled covers
   *  via the code → require map in `covers.ts`, else falls back to celestial art. */
  art?: string | null;
  tracks: CatalogTrack[];
}

export interface CatalogCategory {
  id: string;
  title: string;
  blurb: string;
  albums: CatalogAlbum[];
}
