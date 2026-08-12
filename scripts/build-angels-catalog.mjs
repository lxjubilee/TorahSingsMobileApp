// Regenerates src/content/angelsCatalog/data.ts from the published catalog
// manifest.
//
//   node scripts/build-angels-catalog.mjs                 # fetch from the CDN
//   node scripts/build-angels-catalog.mjs --manifest f.json  # use a local copy
//   node scripts/build-angels-catalog.mjs --check         # verify only, write nothing
//
// The manifest at https://cdn.torahsings.com/catalog-manifest.json is the source
// of truth: it lists every album under the CDN's `music/` tree along with the
// artwork and audio actually published. Album/track paths here are stored
// RELATIVE TO `music/` (`rel`), which is the convention `player.ts` and
// `covers.ts` prefix back on.
//
// Album `hue` and `glyph` seed the procedural celestial-art placeholder shown
// when a cover has not loaded. They are cosmetic but must stay STABLE across
// regenerations, so existing values are carried over from the current data.ts
// and only genuinely new albums get a freshly derived pair.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src/content/angelsCatalog/data.ts');
const MANIFEST_URL = 'https://cdn.torahsings.com/catalog-manifest.json';

/**
 * The app's browse divisions: the Hebrew canon (Torah / Nevi'im / Ketuvim) for
 * the Tanakh, then Gospels, Letters and Revelation. Book numbers are the
 * canonical 1-66, so Prophets and Writings interleave rather than forming
 * contiguous ranges — hence explicit sets rather than from/to bounds.
 */
const DIVISIONS = [
  {
    id: 'torah',
    title: 'Torah',
    blurb: 'The Five Books — Genesis through Deuteronomy.',
    books: [1, 2, 3, 4, 5],
  },
  {
    id: 'prophets',
    title: 'Prophets',
    blurb: 'The Former and Latter Prophets — Joshua through Malachi.',
    books: [6, 7, 9, 10, 11, 12, 23, 24, 26, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
  },
  {
    id: 'writings',
    title: 'Writings',
    blurb: 'The Ketuvim — Psalms, the wisdom books, and the scrolls.',
    books: [8, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 25, 27],
  },
  {
    id: 'gospels',
    title: 'Gospels',
    blurb: 'The four Gospels and the Acts of the Apostles.',
    books: [40, 41, 42, 43, 44],
  },
  {
    id: 'letters',
    title: 'Letters',
    blurb: 'The Epistles — Romans through Jude.',
    books: [45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65],
  },
  { id: 'revelation', title: 'Revelation', blurb: 'The Unveiling.', books: [66] },
];

const HEBREW = [...'אבגדהוזחטיכלמנסעפצקרשת'];

const stripMusic = (p) => p.replace(/^\/+/, '').replace(/^music\//, '');

/** Deterministic hue for an album that has no recorded one yet. */
function deriveHue(code) {
  let h = 0;
  for (let i = 0; i < code.length; i += 1) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  return h % 360;
}

const deriveGlyph = (bookNum, albumNum) => HEBREW[(bookNum + albumNum - 2) % HEBREW.length];

/**
 * Book folder name as it appears on the CDN — `1Kings`, not the manifest's
 * display `1 Kings`. `covers.ts` rebuilds the album folder from this when an
 * album has no audio to take the path from, so it has to match the real tree.
 */
function bookFolderName(album) {
  const seg = stripMusic(album.directory).split('/')[0]; // "11_1Kings"
  return seg.replace(/^\d+_/, '');
}

/** Carry hue/glyph across from the existing generated file, keyed by album code. */
async function readExistingCosmetics() {
  try {
    const src = await fs.readFile(OUT, 'utf8');
    const start = src.indexOf('= [', src.indexOf('export const angelsCatalog')) + 2;
    const parsed = JSON.parse(src.slice(start, src.lastIndexOf(']') + 1));
    const map = new Map();
    for (const c of parsed) {
      for (const a of c.albums) map.set(a.code, { hue: a.hue, glyph: a.glyph });
    }
    return map;
  } catch {
    return new Map(); // no previous file, or unparseable — derive everything
  }
}

async function loadManifest(argv) {
  const i = argv.indexOf('--manifest');
  if (i !== -1 && argv[i + 1]) return JSON.parse(await fs.readFile(argv[i + 1], 'utf8'));
  const res = await fetch(MANIFEST_URL);
  if (!res.ok) throw new Error(`manifest HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const argv = process.argv.slice(2);
  const manifest = await loadManifest(argv);
  const cosmetics = await readExistingCosmetics();

  const byBook = new Map();
  for (const book of manifest.music?.books ?? []) byBook.set(book.number, book);

  let albumCount = 0;
  let audioAlbums = 0;
  let artAlbums = 0;
  let trackCount = 0;
  const unplaced = new Set(byBook.keys());

  const catalog = DIVISIONS.map((division) => {
    const albums = [];
    for (const bookNum of division.books) {
      unplaced.delete(bookNum);
      const book = byBook.get(bookNum);
      if (!book) continue;

      for (const album of book.albums ?? []) {
        const tracks = (album.songs ?? [])
          .filter((s) => s.audio?.file)
          .sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0))
          .map((s) => ({ n: s.trackNumber, title: s.title, rel: stripMusic(s.audio.file) }));

        const kept = cosmetics.get(album.code);
        albums.push({
          code: album.code,
          title: album.title,
          book: bookFolderName(album),
          bookNum: album.bookNumber,
          hue: kept?.hue ?? deriveHue(album.code),
          glyph: kept?.glyph ?? deriveGlyph(album.bookNumber, album.albumNumber ?? 1),
          // The generator's record of artwork published for this album; browse
          // surfaces hide albums without it (see visible.ts).
          art: album.artwork?.file ? stripMusic(album.artwork.file) : null,
          tracks,
        });

        albumCount += 1;
        if (tracks.length) audioAlbums += 1;
        if (album.artwork?.file) artAlbums += 1;
        trackCount += tracks.length;
      }
    }
    albums.sort((a, b) => a.bookNum - b.bookNum || a.code.localeCompare(b.code));
    return { ...division, books: undefined, albums };
  }).map(({ id, title, blurb, albums }) => ({ id, title, blurb, albums }));

  if (unplaced.size) {
    throw new Error(`books not assigned to any division: ${[...unplaced].join(', ')}`);
  }

  const visible = catalog
    .flatMap((c) => c.albums)
    .filter((a) => !!a.art && a.tracks.length > 0).length;

  const header =
    `// AUTO-GENERATED by scripts/build-angels-catalog.mjs — do not edit by hand.\n` +
    `// Source: ${MANIFEST_URL} (the CDN's music/ tree).\n` +
    `// ${albumCount} albums · ${audioAlbums} with audio · ${artAlbums} with cover art · ${trackCount} tracks.\n` +
    `// ${visible} albums are listable on browse surfaces (art AND audio — see visible.ts).\n` +
    `// Paths in \`rel\`/\`art\` are relative to the CDN's music/ folder.\n` +
    `import type { CatalogCategory } from './types';\n\n` +
    `export const angelsCatalog: CatalogCategory[] = `;

  const body = `${JSON.stringify(catalog, null, 2)};\n`;

  console.log(
    `${albumCount} albums · ${audioAlbums} with audio · ${artAlbums} with art · ${trackCount} tracks · ${visible} listable`,
  );

  if (argv.includes('--check')) {
    console.log('--check: nothing written');
    return;
  }
  await fs.writeFile(OUT, header + body, 'utf8');
  console.log(`wrote ${path.relative(ROOT, OUT)} (${((header.length + body.length) / 1024).toFixed(0)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
