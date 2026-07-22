// Optional bundled album covers, keyed by catalog `code`.
//
// INTENTIONALLY EMPTY: the CDN is the source of truth for catalog art (see
// catalogCoverPath), and the local copies have been removed from
// assets/angels/art so covers can be updated without shipping a build. An entry
// here would only buy an instant placeholder painted under the CDN image while
// it streams in, plus an offline fallback; with none, albums show the frame
// until the CDN image lands, then celestial art if it never does.
//
// To re-add one: drop the file in assets/angels/art and add its line below.
// React Native require() needs a static string literal, so Metro resolves these
// at bundle time — which also means a stale entry pointing at a deleted asset
// fails the whole bundle with "development server returned response error code
// 500". Delete the asset and its line together (cf. heroBannerImages).
import type { CatalogAlbum } from './types';

export const CATALOG_COVERS: Record<string, number> = {};

/** Bundled cover for a catalog code, or undefined to fall back to celestial art. */
export function catalogCover(code: string): number | undefined {
  return CATALOG_COVERS[code];
}

/**
 * The formats a cover is published in, in the order the app should try them.
 * webp first: it is the same 1600x1600 image at roughly a tenth the bytes
 * (~320 KB against ~3 MB), so it is what should actually be fetched. png stays
 * as a second attempt because it is the format the bucket was originally filled
 * with — an album published in only that format still resolves.
 */
export const COVER_FORMATS = ['webp', 'png'] as const;
export type CoverFormat = (typeof COVER_FORMATS)[number];

/**
 * CDN-relative cover path for a catalog album.
 *
 * Covers live under the `torahsings/` prefix — NOT the `music/` tree the catalog
 * manifest describes, which belongs to Jubilujah — laid out as
 * `torahsings/<NN>_<Book>/<CODE> <Title>/artwork/<CODE>.<ext>`.
 *
 * The album's folder is taken from its first track's `rel` when it has audio
 * (exact, since `rel` is the same folder plus `/tracks/...`), and otherwise
 * rebuilt from that naming convention. The rebuild was validated against all 48
 * albums whose real folder IS known from a `rel`: 48/48 match.
 *
 * Returns the RELATIVE path — `cdnUrl()` prefixes the host and encodes each
 * segment, which these paths need (spaces, apostrophes, commas in titles).
 */
export function catalogCoverPath(album: CatalogAlbum, format: CoverFormat = 'webp'): string {
  const rel = album.tracks[0]?.rel;
  const folder = rel
    ? rel.split('/tracks/')[0]
    : `${String(album.bookNum).padStart(2, '0')}_${album.book}/${album.code} ${album.title}`;
  return `torahsings/${folder}/artwork/${album.code}.${format}`;
}

/**
 * Cover paths observed to 404 this session. Most of the catalog has no artwork
 * published yet, and a miss costs a ~27 KB HTML error page — so remembering the
 * misses keeps a full catalog scroll from re-fetching megabytes of 404s.
 *
 * Deliberately in-memory rather than the persisted `artworkSlice`: that slice
 * never retries a path once marked, which would permanently freeze out any cover
 * uploaded later — the opposite of the point of sourcing art from the CDN. A
 * plain Set retries once per launch, so new uploads appear on the next start.
 */
const missingCovers = new Set<string>();

/** Whether this cover path already 404'd this session (skip the request). */
export function isCoverMissing(path: string): boolean {
  return missingCovers.has(path);
}

/** Record a 404 so siblings rendering the same album don't re-request it. */
export function markCoverMissing(path: string): void {
  missingCovers.add(path);
}
