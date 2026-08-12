/**
 * The catalog shape the app's mappers consume — the source of truth for all
 * album/track metadata.
 *
 * This is no longer the wire format. The CDN now serves the Torah Sings
 * manifest (`${CATALOG_BASE_URL}/catalog-manifest.json`), which is organised by
 * Bible book; `./torahSingsManifest` translates it into these types on fetch,
 * so everything downstream is unchanged. See that module for the mapping.
 *
 * It is intentionally separate from the app's domain models in
 * `@/types` — `manifestMappers` translates between the two, so a manifest shape
 * change is absorbed here and never ripples into screens/redux.
 *
 * Notable gaps vs. the domain model: the manifest carries NO track duration,
 * release year, artist image, or editorial home rails. Those are defaulted or
 * synthesized by the mapper. (Album `genres` ARE present — see ManifestAlbum.)
 */

export interface ManifestTrack {
  /** 1-based track number within the album. */
  n: number;
  title: string;
  /** Original filename, e.g. "01 The Phone Call.mp3". */
  file: string;
  /**
   * CDN path RELATIVE TO `/music/`, e.g.
   * "albums/inspire/caleb-inspire/CAIM1001EN-anchor-in-the-storm/tracks/01 The Phone Call.mp3".
   * Contains spaces — must be URL-encoded before use (handled by cdnUrl()).
   */
  url: string;
  /** Whether this entry is a playable audio file. */
  audio: boolean;
  /**
   * Track duration in seconds when the manifest carries it (Torah Sings does;
   * the legacy manifest did not). Absent ⇒ 0, and track-player reports the real
   * duration once the file loads.
   */
  dur?: number;
}

export interface ManifestAlbum {
  /** Stable album code, e.g. "CAIM1001EN". Used as the domain Album id. */
  code: string;
  title: string;
  /** Folder name, e.g. "CAIM1001EN-anchor-in-the-storm". */
  folder: string;
  /**
   * CDN path RELATIVE TO `/music/`, e.g.
   * "albums/inspire/caleb-inspire/CAIM1001EN-anchor-in-the-storm".
   */
  path: string;
  /** 1 when the album has playable audio, 0 otherwise. */
  playable: number;
  trackCount: number;
  /**
   * True when the album's cover PNG (`<path>/artwork/<code>.png`) is published
   * to the CDN. Absent ⇒ assume present (legacy manifests stay fully visible);
   * only an explicit `false` hides the album. See manifestMappers.hasArtwork().
   */
  hasArtwork?: boolean;
  /**
   * Full cover path relative to the CDN root — already carries the `music/`
   * prefix and the real extension (Torah Sings covers are `.webp`). Absent ⇒
   * fall back to the legacy `music/<path>/artwork/<code>.png` convention.
   */
  cover?: string;
  /**
   * Genre tags for the album, most-specific first, e.g. ["Gospel", "Honky-Tonk"].
   * Pre-resolved into the manifest (the web derives these from album-genres.json).
   * Absent/empty for ~14% of albums — treat as "no genres".
   */
  genres?: string[];
  tracks: ManifestTrack[];
}

export interface ManifestArtist {
  slug: string;
  name: string;
  /** Free-text descriptor, e.g. "Sufi Christian / Messianic". Mapped to bio. */
  role?: string;
  albums: ManifestAlbum[];
}

export interface ManifestCategory {
  key: string;
  label: string;
  artists: ManifestArtist[];
}

/**
 * One published article. All paths are relative to the CDN root and resolved by
 * `cdnUrl()`, same as album media.
 */
export interface CatalogArticle {
  slug: string;
  title: string;
  /** Markdown body, e.g. `articles/hebraic/<slug>.md`. Fetched on open. */
  file: string;
  /** Standfirst shown on cards and under the headline. */
  excerpt: string;
  author: string;
  /** The author's office, e.g. "Teacher & Apostle". */
  office?: string;
  /** Hero image, e.g. `articles/hebraic/images/<slug>.webp`. Absent ⇒ celestial art. */
  heroImage?: string;
  readingTimeMinutes: number;
  /** Editorial sort key, ascending. */
  order: number;
}

/** A published article collection, e.g. Hebraic Christianity. */
export interface CatalogArticleCollection {
  /** Stable id, e.g. `hebraic`. */
  slug: string;
  /** Display name, e.g. "Hebraic Christianity". */
  category: string;
  /** Sorted by `order`. */
  articles: CatalogArticle[];
}

export interface CatalogManifest {
  /** ISO-8601 timestamp the manifest was generated; used as a cache key. */
  generated: string;
  totalArtists: number;
  totalAlbums: number;
  totalPlayableAlbums: number;
  totalPlayableTracks: number;
  categories: ManifestCategory[];
  /**
   * Published article collections. Optional because a legacy music-only
   * manifest carries none — callers must treat absence as "no articles".
   */
  articles?: CatalogArticleCollection[];
}
