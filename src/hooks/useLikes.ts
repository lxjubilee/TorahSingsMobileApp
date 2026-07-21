import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/redux';
import { Album, Track } from '@/types';
import { songLikeKey, albumLikeKey, getAlbumUuidMap, catalogAlbumUuidMap } from '@/services/likes';
import type { CatalogAlbum } from '@/content/angelsCatalog/types';
import { getSongUuidMap } from '@/services/playlists';
import { useVisibleTracks, useVisibleAlbums } from './useVisibleCatalog';

/** Is this track liked? (false for tracks with no track number.) */
export function useIsSongLiked(track: Pick<Track, 'albumId' | 'trackNumber'>): boolean {
  const key = songLikeKey(track);
  return useAppSelector((s) => (key ? !!s.likes.keys[key] : false));
}

/** Is this album liked? */
export function useIsAlbumLiked(album: Pick<Album, 'id'>): boolean {
  const key = albumLikeKey(album);
  return useAppSelector((s) => !!s.likes.keys[key]);
}

/** Count of liked songs. */
export function useLikedSongCount(): number {
  return useAppSelector(
    (s) => Object.keys(s.likes.keys).filter((k) => k.startsWith('song:')).length,
  );
}

/**
 * Liked albums from the bundled Angels' Catalog. Kept separate from
 * useLikedAlbums() because the catalog isn't in the manifest and its albums are
 * `CatalogAlbum`s (rendered by CatalogTile, opened via the CatalogAlbum route),
 * not domain `Album`s. Synchronous — the catalog ships with the app.
 */
export function useLikedCatalogAlbums(): CatalogAlbum[] {
  const keys = useAppSelector((s) => s.likes.keys);
  return useMemo(() => {
    const byUuid = catalogAlbumUuidMap();
    const out: CatalogAlbum[] = [];
    for (const k of Object.keys(keys)) {
      if (!k.startsWith('album:')) continue;
      const a = byUuid.get(k.slice('album:'.length));
      if (a) out.push(a);
    }
    return out;
  }, [keys]);
}

/**
 * The liked songs resolved to playable local `Track`s (for the LikedSongs
 * screen). Liked song uuids -> local Track via the catalog reverse map (built
 * once, cached); uuids not in the catalog are dropped. Never language-filtered —
 * a personal collection. `loading` is true only until the reverse map is ready.
 */
export function useLikedTracks(): { tracks: Track[]; loading: boolean } {
  const keys = useAppSelector((s) => s.likes.keys);
  const [reverse, setReverse] = useState<Map<string, Track> | null>(null);

  useEffect(() => {
    let active = true;
    getSongUuidMap()
      .then((m) => active && setReverse(m))
      .catch(() => active && setReverse(new Map()));
    return () => {
      active = false;
    };
  }, []);

  const resolved = useMemo(() => {
    if (!reverse) return [];
    const out: Track[] = [];
    for (const k of Object.keys(keys)) {
      if (!k.startsWith('song:')) continue;
      const t = reverse.get(k.slice('song:'.length));
      if (t) out.push(t);
    }
    return out;
  }, [reverse, keys]);

  const tracks = useVisibleTracks(resolved, { filterByLanguage: false });
  return { tracks, loading: reverse == null };
}

/**
 * The liked albums resolved to local `Album`s (for the Library grid). Never
 * language-filtered. `loading` is true only until the album reverse map is ready.
 */
export function useLikedAlbums(): { albums: Album[]; loading: boolean } {
  const keys = useAppSelector((s) => s.likes.keys);
  const [reverse, setReverse] = useState<Map<string, Album> | null>(null);

  useEffect(() => {
    let active = true;
    getAlbumUuidMap()
      .then((m) => active && setReverse(m))
      .catch(() => active && setReverse(new Map()));
    return () => {
      active = false;
    };
  }, []);

  const resolved = useMemo(() => {
    if (!reverse) return [];
    const out: Album[] = [];
    for (const k of Object.keys(keys)) {
      if (!k.startsWith('album:')) continue;
      const a = reverse.get(k.slice('album:'.length));
      if (a) out.push(a);
    }
    return out;
  }, [reverse, keys]);

  const albums = useVisibleAlbums(resolved, { filterByLanguage: false });
  return { albums, loading: reverse == null };
}
