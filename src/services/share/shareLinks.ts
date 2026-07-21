import { Platform, Share } from 'react-native';
import * as Linking from 'expo-linking';
import { logger } from '@/utils';

/**
 * Album sharing + share-link parsing.
 *
 * The canonical share URL is an https link to the Torah Sings album page, which
 * takes the album code as a PATH segment:
 *
 *   https://torahsings.com/album/<ALBUM_CODE>
 *
 * That one URL renders a rich preview (the web page's Open Graph tags), opens
 * the app to the album when installed, and falls back to the site otherwise.
 * `album.id` / `track.albumId` IS the album code.
 *
 * This used to point at `jubilujah.com/album?c=<CODE>`, which 404s: wrong brand
 * AND wrong shape. TorahSings.com routes albums as `/album/[id]`
 * (app/album/[id]/page.tsx pre-renders every catalog code), so the query form
 * fails even on the right host. `parseShareLink` below still accepts the old
 * form so links already out in the wild keep resolving.
 *
 * Sharing is album-level: there is no per-track web page, so a shared link
 * always resolves to an album.
 */

const WEB_HOST = 'torahsings.com';

/** Minimal album shape needed to build a share. */
export interface AlbumShareInput {
  /** Album code (Album.id / Track.albumId). */
  code: string;
  title: string;
  artistName: string;
}

export function buildAlbumShareUrl(code: string): string {
  return `https://${WEB_HOST}/album/${encodeURIComponent(code)}`;
}

/** Open the native share sheet (WhatsApp, Messenger, Email, SMS, …) for an album. */
export async function shareAlbum(album: AlbumShareInput): Promise<void> {
  const url = buildAlbumShareUrl(album.code);
  const heading = `${album.title} — ${album.artistName}`;
  try {
    if (Platform.OS === 'ios') {
      // iOS uses `url` for the link preview; `message` is the accompanying text.
      await Share.share({ message: heading, url });
    } else {
      // Android ignores `url`; fold it into the message.
      await Share.share({ message: `${heading}\n${url}` });
    }
  } catch (e) {
    // Sharing throws if the user dismisses the sheet — not an error worth surfacing.
    logger.warn('shareAlbum failed', e);
  }
}

/**
 * Parse an incoming deep link into an album code. Accepts the canonical web URL,
 * the custom-scheme variants, and the legacy `jubilujah://track/<id>` form
 * (id is `<code>-<index>-<n>`) so older shares still resolve to their album.
 */
export function parseShareLink(url: string): { albumCode: string } | null {
  if (!url) return null;
  let parsed: Linking.ParsedURL;
  try {
    parsed = Linking.parse(url);
  } catch {
    return null;
  }

  const q = (parsed.queryParams ?? {}) as Record<string, string | string[] | undefined>;
  const flat = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const segs = [parsed.hostname ?? '', ...(parsed.path ?? '').split('/')].filter(Boolean);

  // 1) …/album?c=<CODE>
  const c = flat(q.c) ?? flat(q.code);
  if (c) return { albumCode: String(c) };

  // 2) …/album/<CODE>
  const ai = segs.indexOf('album');
  if (ai >= 0 && segs[ai + 1]) return { albumCode: decodeURIComponent(segs[ai + 1]) };

  // 3) legacy …/track/<code>-<index>-<n>  ->  resolve to the album
  const ti = segs.indexOf('track');
  if (ti >= 0 && segs[ti + 1]) {
    const id = decodeURIComponent(segs[ti + 1]);
    const parts = id.split('-');
    return { albumCode: parts.length >= 3 ? parts.slice(0, -2).join('-') : id };
  }

  return null;
}
