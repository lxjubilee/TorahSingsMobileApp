import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { clearSession, signOut } from './authSlice';

/**
 * Follows — artists and albums (local-only: there is no backend follow endpoint
 * on either platform; the web's Follow button is plain component state that
 * resets on reload, so persisting here already beats it). Song/album LIKES are
 * different: those are server-backed in the `likes` slice, and the "Favorites"
 * shortcut and album grids read from there.
 *
 * Album ids are catalog codes (the `Album.id` space `albumUuid()` hashes), so
 * they convert without migration if a follow endpoint ever lands.
 */
interface LibraryState {
  followedArtistIds: string[];
  followedAlbumIds: string[];
}

const initialState: LibraryState = {
  followedArtistIds: [],
  followedAlbumIds: [],
};

const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    toggleFollowArtist(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.followedArtistIds = state.followedArtistIds.includes(id)
        ? state.followedArtistIds.filter((a) => a !== id)
        : [id, ...state.followedArtistIds];
    },
    /** Follow / unfollow an album by its catalog code. Newest first. */
    toggleFollowAlbum(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.followedAlbumIds = state.followedAlbumIds.includes(id)
        ? state.followedAlbumIds.filter((a) => a !== id)
        : [id, ...state.followedAlbumIds];
    },
  },
  extraReducers: (builder) => {
    // Follows are persisted to AsyncStorage, so without this they outlive the
    // account that made them — the next person to sign in on this device would
    // inherit the previous user's follows. Mirrors likesSlice.
    builder
      .addCase(clearSession, () => initialState)
      .addCase(signOut.fulfilled, () => initialState);
  },
});

export const { toggleFollowArtist, toggleFollowAlbum } = librarySlice.actions;
export default librarySlice.reducer;
