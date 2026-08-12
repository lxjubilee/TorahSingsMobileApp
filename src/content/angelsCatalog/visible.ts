// What the catalog *browse* surfaces are allowed to list.
//
// The bundled data describes the whole Torah Sings plan — 285 albums — and as of
// the last catalog build 276 of them have audio and all 285 have cover art. The
// remaining 9 are lyrics-only. An album with no tracks opens onto an empty track
// list, and one with no artwork renders as procedural celestial art; neither
// reads as a real release. So every browse surface (Home rails, Browse, Search,
// the division grids, the album screen's rails) lists only albums that have BOTH.
//
// Deliberately NOT applied to lookup-by-code (catalogAlbumByCode, the album
// screen's findAlbum, deep links) or to personal collections (likes, follows,
// playlists): anything a user already saved must still open, and every track in
// `allCatalogTracks` stays playable and searchable.
//
// `art` is the generator's record of artwork published to the CDN at build time
// (see the header of data.ts). It is the only static signal available — covers
// stream from the CDN, so art or audio published after the last catalog build
// stays hidden here until `scripts/build-angels-catalog.mjs` is re-run. That
// script reads the live catalog manifest, so re-running it is the whole update.

import { angelsCatalog } from './data';
import type { CatalogAlbum, CatalogCategory } from './types';

/** An album is listable when it has cover art AND at least one track. */
export function isCatalogAlbumPublished(album: CatalogAlbum): boolean {
  return !!album.art && album.tracks.length > 0;
}

/** Same shape as `angelsCatalog`, minus unpublished albums and emptied divisions. */
export const visibleCatalog: CatalogCategory[] = angelsCatalog
  .map((category) => ({ ...category, albums: category.albums.filter(isCatalogAlbumPublished) }))
  .filter((category) => category.albums.length > 0);

/** Listable albums flattened across divisions and deduped by code. */
export const visibleCatalogAlbums: CatalogAlbum[] = Array.from(
  new Map(visibleCatalog.flatMap((c) => c.albums).map((a) => [a.code, a])).values(),
);
