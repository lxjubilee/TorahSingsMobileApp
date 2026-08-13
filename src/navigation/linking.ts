import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Deep-link configuration for the custom scheme + universal/App Links on the
 * web domain, e.g. torahsings://album/JEIM1071EN or
 * https://torahsings.com/album/JEIM1071EN — the same host `buildAlbumShareUrl`
 * emits, so the app's own share links open it.
 * Album share links are handled by useShareDeepLinks, which navigates to the
 * album; React Navigation owns the path-style routes below.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['torahsings://', 'https://torahsings.com', 'https://www.torahsings.com'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          HomeTab: 'home',
          BrowseTab: 'browse',
          SearchTab: 'search',
          PlaylistsTab: 'playlists',
        },
      },
      AlbumDetails: 'album/:albumId',
      ArtistDetails: 'artist/:artistId',
      // The Learn Hebrew hub. The former `learn-hebrew/:slug` level detail was
      // removed along with the bundled curriculum; the hub is the article
      // library now.
      LearnHebrew: 'learn-hebrew',
      MusicPlayer: 'player',
    },
  },
};
