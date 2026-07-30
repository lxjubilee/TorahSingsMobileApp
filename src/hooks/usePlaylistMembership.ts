import { useAppSelector } from '@/redux';
import { Track } from '@/types';
import { trackSongUuid } from '@/services/playlists';

/**
 * Is this track in at least one of the user's playlists? Reads the `playlists`
 * slice's `membership` map (song uuid -> count of playlists containing it),
 * which updates optimistically on add/remove — so the "add to playlist" control
 * can flip to an "added" state the moment a track is added. False for tracks
 * with no track number (no deterministic server song_id).
 */
export function useIsSongInPlaylist(track: Pick<Track, 'albumId' | 'trackNumber'>): boolean {
  const songId = trackSongUuid(track);
  return useAppSelector((s) => (songId ? (s.playlists.membership[songId] ?? 0) > 0 : false));
}
