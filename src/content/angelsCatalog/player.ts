// Bridges the ported Angels' Catalog data to the app's playback engine. Each
// CatalogTrack.rel is the CDN path minus the `torahsings/` prefix, so we build
// a CDN-relative `Track.url` and let the existing trackAdapter -> cdnUrl()
// pipeline encode + prefix the host. No new CDN/player infrastructure needed.

import type { Track } from '@/types';
import { angelsCatalog } from './data';
import type { CatalogAlbum } from './types';

// Matches the "Sung by the Angels" copy shown on the album/track rows.
const ARTIST_NAME = 'The Angels';

/** Stable, unique player-track id for a catalog track (by array index). */
export function catalogTrackId(albumCode: string, index: number): string {
  return `${albumCode}-${index}`;
}

/**
 * Map one Angels'-Catalog album to the player's domain Track[]. The whole
 * engine (trackAdapter, queue, sync, mini-player, MusicPlayer screen) then
 * works unchanged.
 */
export function albumToPlayerTracks(album: CatalogAlbum): Track[] {
  return album.tracks.map((tk, i) => ({
    // Array index (not `n`) keeps ids unique even where the source data repeats
    // a track number (e.g. ANSMX02009EN has two tracks numbered 5).
    id: catalogTrackId(album.code, i),
    title: tk.title,
    // CDN-relative; trackAdapter runs this through cdnUrl(), which prefixes the
    // host and URL-encodes each segment (spaces -> %20).
    url: `torahsings/${tk.rel}`,
    // Placeholder for now — the mini-player / now-playing screen fall back to
    // their own placeholder art. (CDN cover path TBD.)
    artwork: '',
    // Unknown up front; the app resolves real duration on demand via
    // useTrackDuration / getAudioDuration, exactly like manifest tracks.
    duration: 0,
    artistId: 'angels',
    artistName: ARTIST_NAME,
    // albumId = album code + trackNumber = n so trackSongUuid() computes the same
    // deterministic server song_id the playlist backend uses (see songId.ts).
    albumId: album.code,
    albumName: album.title,
    trackNumber: tk.n,
  }));
}

/**
 * The whole Torah Sings catalog, flattened across divisions and deduped by album
 * code (bundled data can list an album under more than one place). Built once at
 * import — no fetch, works offline. Shared by Browse / Search / playlist add.
 */
export const allCatalogAlbums: CatalogAlbum[] = Array.from(
  new Map(angelsCatalog.flatMap((c) => c.albums).map((a) => [a.code, a])).values(),
);

/** Every catalog track as a player-ready domain Track (built once at import). */
export const allCatalogTracks: Track[] = allCatalogAlbums.flatMap(albumToPlayerTracks);

// Code -> album, for callers holding only a `Track.albumId` (the catalog code)
// that need the album's art metadata — e.g. the playlist cover, which falls back
// to the album's hue/glyph when no bundled cover exists.
let byCode: Map<string, CatalogAlbum> | null = null;

/** Look up a catalog album by its code (memoized). */
export function catalogAlbumByCode(code: string): CatalogAlbum | undefined {
  if (!byCode) byCode = new Map(allCatalogAlbums.map((a) => [a.code, a]));
  return byCode.get(code);
}
