import {
  CatalogArticleCollection,
  CatalogManifest,
  ManifestAlbum,
  ManifestArtist,
  ManifestTrack,
} from './manifestTypes';

/**
 * The Torah Sings catalog manifest (`cdn.torahsings.com/catalog-manifest.json`)
 * and its translation into the shape the rest of the catalog layer already
 * speaks (`./manifestTypes`).
 *
 * The Torah Sings manifest is organised by the 66 books of the Bible
 * (`music.books[] -> albums[] -> songs[]`), where the legacy JubileeVerse
 * manifest was organised by catalog family (`categories[] -> artists[] ->
 * albums[] -> tracks[]`). Rather than ripple that difference through the
 * mappers, repositories, redux and screens, it is absorbed here — exactly the
 * separation `manifestTypes` was written to provide.
 *
 * The mapping is:
 *   testament section  ->  ManifestCategory   (Torah, Prophets, Gospels & Acts, …)
 *   book               ->  ManifestArtist     (Genesis, 1 Kings, Revelation, …)
 *   album              ->  ManifestAlbum
 *   song (with audio)  ->  ManifestTrack
 *
 * Two things the legacy manifest lacked and this one carries are passed
 * through: real per-track durations (`ManifestTrack.dur`) and the true cover
 * path (`ManifestAlbum.cover`, a `.webp` rather than the legacy `.png`).
 *
 * Paths in this manifest are POSIX-style and relative to the CDN root, so they
 * already carry the `music/` prefix that the legacy convention appended. They
 * are normalised back to the legacy "relative to /music/" form here so
 * `manifestMappers` keeps building URLs the one way it always has.
 */

interface TsAudioFile {
  /** POSIX path relative to the CDN root, e.g. `music/01_Genesis/…/tracks/01 X.mp3`. */
  file: string;
  filename: string;
  /** Decoded duration in seconds, e.g. 327.8. */
  durationSeconds?: number;
}

interface TsSong {
  id: string;
  trackNumber: number;
  sortOrder?: number;
  title: string;
  albumId: string;
  /** Lead performer, e.g. "Elias Inspire". Per-song, not per-album. */
  artist?: string;
  hasAudio: boolean;
  audio?: TsAudioFile;
}

interface TsArtwork {
  /** POSIX path relative to the CDN root; `.webp` across the whole catalog. */
  file: string;
  filename: string;
  format?: string;
}

interface TsAlbum {
  id: string;
  code: string;
  title: string;
  bookNumber: number;
  bookName: string;
  /** e.g. `music/01_Genesis/ANSMX01001EN The Morning Stars Sang`. */
  directory: string;
  artwork?: TsArtwork;
  songs?: TsSong[];
  songCount?: number;
  songsWithAudio?: number;
  /** `complete` | `partial` | `lyrics-only`. */
  productionStatus?: string;
  durationSeconds?: number;
}

interface TsBook {
  /** e.g. `01_Genesis`. */
  id: string;
  /** Canonical book number, 1–66. */
  number: number;
  /** Display-ready name, e.g. `1 Kings`, `Song Of Songs`. */
  name: string;
  directory: string;
  albums?: TsAlbum[];
}

interface TsArticleImage {
  /** POSIX path relative to the CDN root. */
  file: string;
  /** False when the manifest recorded the path but the file is not published. */
  exists?: boolean;
}

interface TsArticle {
  slug: string;
  title: string;
  /** Markdown body, relative to the CDN root. */
  file: string;
  excerpt?: string;
  author?: string;
  office?: string;
  personaSlug?: string;
  heroImage?: TsArticleImage;
  readingTimeMinutes?: number;
  wordCount?: number;
  order?: number;
  /** False when the article exists on disk but is withheld from the index. */
  inIndex?: boolean;
}

interface TsArticleCollection {
  slug: string;
  /** Display name, e.g. "Hebraic Christianity". */
  category?: string;
  categorySlug?: string;
  directory?: string;
  articles?: TsArticle[];
}

export interface TorahSingsManifest {
  manifestVersion?: string;
  generator?: string;
  /** ISO-8601 timestamp; the legacy manifest called this `generated`. */
  generatedAt: string;
  music?: { directory?: string; books?: TsBook[] };
  articles?: { directory?: string; collections?: TsArticleCollection[] };
}

/** Cheap structural probe — distinguishes this manifest from the legacy one. */
export function isTorahSingsManifest(m: unknown): m is TorahSingsManifest {
  const c = m as Partial<TorahSingsManifest> & { categories?: unknown };
  return !!c && Array.isArray(c.music?.books) && !Array.isArray(c.categories);
}

/**
 * The 66 books grouped into the app's browse divisions, by canonical book
 * number. These MIRROR the bundled catalog's divisions (see
 * `content/angelsCatalog` and `scripts/build-angels-catalog.mjs`) so both
 * catalog surfaces name and group things identically.
 *
 * The Tanakh split is the Hebrew canon, not the Christian ordering: Prophets is
 * the Former plus Latter Prophets and Writings is the Ketuvim, so the two
 * interleave across 6–39 rather than forming contiguous ranges. Hence explicit
 * book sets. Together they cover all 66 exactly once — `adaptTorahSingsManifest`
 * asserts that.
 */
const SECTIONS: ReadonlyArray<{ key: string; label: string; books: readonly number[] }> = [
  { key: 'torah', label: 'Torah', books: [1, 2, 3, 4, 5] },
  {
    key: 'prophets',
    label: 'Prophets',
    books: [6, 7, 9, 10, 11, 12, 23, 24, 26, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
  },
  { key: 'writings', label: 'Writings', books: [8, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 25, 27] },
  { key: 'gospels', label: 'Gospels', books: [40, 41, 42, 43, 44] },
  {
    key: 'letters',
    label: 'Letters',
    books: [45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65],
  },
  { key: 'revelation', label: 'Revelation', books: [66] },
];

/** Strip the leading `music/` so paths match the legacy "relative to /music/" convention. */
const toMusicRelative = (path: string): string =>
  path.replace(/^\/+/, '').replace(/^music\//, '');

const basename = (path: string): string => path.split('/').filter(Boolean).pop() ?? '';

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function adaptTrack(song: TsSong): ManifestTrack | null {
  const file = song.audio?.file;
  if (!song.hasAudio || !file) return null;
  return {
    n: song.trackNumber ?? song.sortOrder ?? 0,
    title: song.title,
    file: song.audio?.filename ?? basename(file),
    url: toMusicRelative(file),
    audio: true,
    dur: song.audio?.durationSeconds,
  };
}

function adaptAlbum(album: TsAlbum): ManifestAlbum {
  const tracks = (album.songs ?? [])
    .map(adaptTrack)
    .filter((t): t is ManifestTrack => t !== null);

  return {
    code: album.code,
    title: album.title,
    folder: basename(album.directory),
    path: toMusicRelative(album.directory),
    playable: tracks.length > 0 ? 1 : 0,
    // Count what is actually playable, so the UI never promises a track the
    // mapper then filters out.
    trackCount: tracks.length,
    hasArtwork: !!album.artwork?.file,
    cover: album.artwork?.file,
    tracks,
  };
}

/**
 * Article collections, carried through so the reader is served from the same
 * cached manifest as the music — no second index fetch. Only the fields the app
 * renders are kept; the manifest's authoring metadata (image prompts, word
 * counts, per-heading outlines) is dropped so the persisted snapshot stays small.
 */
function adaptArticles(src: TorahSingsManifest): CatalogArticleCollection[] {
  return (src.articles?.collections ?? [])
    .map((collection) => ({
      slug: collection.slug,
      category: collection.category ?? collection.slug,
      articles: (collection.articles ?? [])
        .filter((a) => a.slug && a.file && a.inIndex !== false)
        .map((a) => ({
          slug: a.slug,
          title: a.title,
          file: a.file,
          excerpt: a.excerpt ?? '',
          author: a.author ?? '',
          office: a.office,
          // An image the manifest knows is unpublished must not be requested;
          // the card falls back to celestial art instead of a 404.
          heroImage: a.heroImage?.exists === false ? undefined : a.heroImage?.file,
          readingTimeMinutes: a.readingTimeMinutes ?? 0,
          order: a.order ?? 0,
        }))
        .sort((x, y) => x.order - y.order || x.title.localeCompare(y.title)),
    }))
    .filter((c) => c.articles.length > 0);
}

/** Translate the Torah Sings manifest into the legacy `CatalogManifest` shape. */
export function adaptTorahSingsManifest(src: TorahSingsManifest): CatalogManifest {
  const books = src.music?.books ?? [];

  let totalArtists = 0;
  let totalAlbums = 0;
  let totalPlayableAlbums = 0;
  let totalPlayableTracks = 0;

  const byNumber = new Map(books.map((b) => [b.number, b]));

  const categories = SECTIONS.map((section) => {
    const artists: ManifestArtist[] = [];

    // Iterate the section's book list, so books come out in canonical order
    // regardless of how the manifest happened to order them.
    for (const bookNumber of section.books) {
      const book = byNumber.get(bookNumber);
      if (!book) continue;

      const albums = (book.albums ?? []).map(adaptAlbum);
      if (albums.length === 0) continue;

      totalArtists += 1;
      totalAlbums += albums.length;
      for (const a of albums) {
        if (a.playable === 1) totalPlayableAlbums += 1;
        totalPlayableTracks += a.tracks.length;
      }

      artists.push({
        slug: slugify(book.name) || slugify(book.id),
        name: book.name,
        role: `Book ${book.number} · ${section.label}`,
        albums,
      });
    }

    return { key: section.key, label: section.label, artists };
  }).filter((c) => c.artists.length > 0);

  return {
    generated: src.generatedAt,
    totalArtists,
    totalAlbums,
    totalPlayableAlbums,
    totalPlayableTracks,
    categories,
    articles: adaptArticles(src),
  };
}
