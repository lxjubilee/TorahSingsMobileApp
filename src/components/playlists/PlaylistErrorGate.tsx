import React from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/common';
import { useAppDispatch, useAppSelector, clearPlaylistError } from '@/redux';

/**
 * Reports a failed playlist WRITE (add / remove / rename / reorder / delete).
 * Driven by `playlists.mutationError`, set by the rejected-matcher in
 * playlistsSlice. Dismiss-only, mirroring PlaybackLimitGate.
 *
 * It exists because every playlist mutation used to reject into the void: the
 * user tapped, nothing happened, and no amount of retrying produced a clue. The
 * message carries the server's own text, so a foreign-key rejection on
 * catalog.songs (the one thing likes/ratings don't have to satisfy) names itself
 * instead of looking like a broken button.
 */
export const PlaylistErrorGate: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const message = useAppSelector((s) => s.playlists.mutationError);

  if (!message) return null;

  return (
    <ConfirmDialog
      visible
      title={t('playlist.errorTitle')}
      message={message}
      confirmLabel={t('common.ok')}
      onConfirm={() => dispatch(clearPlaylistError())}
    />
  );
};
