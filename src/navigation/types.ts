import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

/** Bottom-tab routes. PlaylistsTab nests its own stack, so it carries those params. */
export type MainTabParamList = {
  HomeTab: undefined;
  BrowseTab: undefined;
  SearchTab: undefined;
  PlaylistsTab: NavigatorScreenParams<PlaylistsStackParamList>;
};

/**
 * Root stack. AlbumDetails/ArtistDetails live here (not inside a tab) so they
 * present full-screen over the tab bar, Netflix-style; MusicPlayer is a modal.
 */
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  AlbumDetails: { albumId: string };
  AlbumReviews: { albumId: string; albumTitle: string };
  ArtistDetails: { artistId: string };
  /** `genreByItem` is carried from a showGenre section so its "See all" grid
   *  captions covers the same way the Home rail does. Albums absent from the map
   *  (the catalog gives them no genre) keep their title. */
  AlbumList: { title: string; artistId?: string; albumIds?: string[]; genreByItem?: Record<string, string> };
  /** `book` narrows the grid to one source book (the album screen's "View All"). */
  CatalogCategory: { categoryId: string; book?: string };
  /** Angels' Catalog album detail; `code` is the catalog album code. */
  CatalogAlbum: { code: string };
  HebraicChristianity: undefined;
  LearnHebrew: undefined;
  /** Learn Hebrew level detail; `slug` is the lesson-album slug. */
  LearnHebrewLevel: { slug: string };
  Article: { slug: string };
  PlaylistDetails: { playlistId: string };
  PlaylistAddSongs: { playlistId: string };
  MusicPlayer: undefined;
};

/** Unauthenticated flow: welcome slides / profile gate → sign in → 2FA; plus sign up. */
export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  TwoFactor: undefined;
  SignUp: undefined;
  VerifySignup: { verificationGuid: string; email: string };
  ForgotPassword: undefined;
  PrivacyPolicy: undefined;
  TermsOfUse: undefined;
};

/**
 * Per-tab inner stack for the Playlists tab. Profile nests here, and it now owns
 * the entry points to LikedSongs / FollowedArtists (previously on the Library
 * screen, which the playlists-only tab replaced).
 */
export type PlaylistsStackParamList = {
  Playlists: undefined;
  LikedSongs: undefined;
  FollowedArtists: undefined;
  Profile: undefined;
  ChangePassword: undefined;
  PrivacyPolicy: undefined;
  TermsOfUse: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

// Typed screen-prop helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type PlaylistsStackScreenProps<T extends keyof PlaylistsStackParamList> =
  NativeStackScreenProps<PlaylistsStackParamList, T>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
