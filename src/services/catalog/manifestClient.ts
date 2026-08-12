import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '@/constants';
import { logger } from '@/utils';
import { storage, STORAGE_KEYS } from '@/services/storage';
import { CatalogManifest } from './manifestTypes';
import { adaptTorahSingsManifest, isTorahSingsManifest } from './torahSingsManifest';

/**
 * Fetches and caches the public catalog manifest from the CDN — the source of
 * truth backing `ManifestDataSource`.
 *
 * Strategy is **stale-while-revalidate**: a persisted snapshot is served
 * immediately on cold start (so lists paint without waiting on the network),
 * while a fresh copy is fetched in the background. If the fresh copy differs
 * (`generated` changed) it replaces the cache and subscribers are notified so
 * the UI can rebuild. Only the first-ever launch (no snapshot) blocks on the
 * network.
 *
 * What gets cached is the ADAPTED manifest, never the raw download. The Torah
 * Sings manifest is ~14 MB on the wire — it carries lyrics, casting notes,
 * blueprints, articles and integrity reports the app never reads, and it would
 * blow past Android's default 6 MB AsyncStorage budget. `adaptTorahSingsManifest`
 * reduces it to the album/track subset the app actually serves, which is a
 * fraction of the size.
 *
 * The snapshot is still stored CHUNKED because even the adapted manifest is
 * large enough to sit near Android's AsyncStorage CursorWindow read limit;
 * ~512 KB chunks read back reliably. All storage access is best-effort — any
 * failure degrades to a plain network fetch.
 */
// CATALOG_BASE_URL, not CDN_BASE_URL: the manifest can be served from a local
// web server for testing while audio and covers still come from the CDN (the
// only host that has them). Defaults to the CDN when no override is set.
// Served at the CDN root — NOT under /music/, which is where the retired
// JubileeVerse manifest lived.
const MANIFEST_URL = `${ENV.CATALOG_BASE_URL.replace(/\/+$/, '')}/catalog-manifest.json`;
const CHUNK_SIZE = 512 * 1024; // characters

/**
 * Version of the ADAPTED shape this build writes. Bump it whenever the app
 * derives something new from the manifest.
 *
 * Revalidation compares the CDN's `generated` timestamp, which only tracks CDN
 * CONTENT. It cannot see that the app now reads MORE out of the same manifest —
 * so a snapshot written by an older build (one that carried no `articles`, say)
 * would be served forever: the fresh copy has an identical `generated` and gets
 * discarded on every launch. Stamping the shape into the cache closes that hole.
 */
const CACHE_SCHEMA = 2;

let current: CatalogManifest | null = null;
let initialLoad: Promise<CatalogManifest> | null = null;
let revalidated = false;
const subscribers = new Set<() => void>();

/** Subscribe to background catalog refreshes (new `generated`). Returns an unsubscribe fn. */
export function onCatalogUpdated(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

export function getManifest(): Promise<CatalogManifest> {
  if (current) return Promise.resolve(current);
  if (!initialLoad) {
    initialLoad = loadInitial().catch((err) => {
      initialLoad = null; // allow retry
      throw err;
    });
  }
  return initialLoad;
}

async function loadInitial(): Promise<CatalogManifest> {
  void purgeLegacyCache(); // one-time reclaim of the retired v1 snapshot
  const cached = await readChunkedCache();
  if (cached) {
    current = cached;
    void revalidate(); // background; don't block first paint
    return cached;
  }
  // First-ever launch: must wait on the network, then seed the cache.
  const fresh = await fetchManifest();
  current = fresh;
  revalidated = true; // already freshest; no background pass needed
  void writeChunkedCache(fresh);
  return fresh;
}

async function revalidate(): Promise<void> {
  if (revalidated) return;
  revalidated = true;
  try {
    const fresh = await fetchManifest();
    if (!current || fresh.generated !== current.generated) {
      current = fresh;
      void writeChunkedCache(fresh);
      subscribers.forEach((cb) => {
        try {
          cb();
        } catch (e) {
          logger.warn('onCatalogUpdated subscriber threw', e);
        }
      });
    }
  } catch (err) {
    logger.warn('catalog revalidation failed; keeping cached snapshot', err);
  }
}

async function fetchManifest(): Promise<CatalogManifest> {
  const res = await fetch(MANIFEST_URL);
  if (!res.ok) throw new Error(`catalog manifest HTTP ${res.status}`);
  const raw: unknown = await res.json();
  // The CDN serves the book-organised Torah Sings manifest; translate it to the
  // shape the mappers consume. A legacy `categories`-shaped manifest (a local
  // override, or a stale host) still passes through untouched.
  if (isTorahSingsManifest(raw)) return adaptTorahSingsManifest(raw);
  return raw as CatalogManifest;
}

interface ChunkMeta {
  count: number;
  generated: string;
  /** The adapted shape this snapshot was written with. See CACHE_SCHEMA. */
  schema?: number;
}

async function readChunkedCache(): Promise<CatalogManifest | null> {
  try {
    const meta = await storage.getItem<ChunkMeta>(STORAGE_KEYS.CATALOG_MANIFEST_META);
    if (!meta?.count) return null;
    // Written by a build that derived a different shape — drop it rather than
    // serve it, because revalidation can't tell it apart from a current one.
    if (meta.schema !== CACHE_SCHEMA) {
      await removeChunked(STORAGE_KEYS.CATALOG_MANIFEST_META, STORAGE_KEYS.CATALOG_MANIFEST_CHUNK, meta.count);
      return null;
    }
    const parts: string[] = [];
    for (let i = 0; i < meta.count; i += 1) {
      const part = await AsyncStorage.getItem(`${STORAGE_KEYS.CATALOG_MANIFEST_CHUNK}${i}`);
      if (part == null) return null; // incomplete cache — ignore
      parts.push(part);
    }
    return JSON.parse(parts.join('')) as CatalogManifest;
  } catch (err) {
    logger.warn('catalog cache read failed', err);
    return null;
  }
}

async function writeChunkedCache(manifest: CatalogManifest): Promise<void> {
  try {
    const str = JSON.stringify(manifest);
    const count = Math.ceil(str.length / CHUNK_SIZE);
    for (let i = 0; i < count; i += 1) {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.CATALOG_MANIFEST_CHUNK}${i}`,
        str.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      );
    }
    // Write meta last so a partially-written cache is never considered valid.
    await storage.setItem<ChunkMeta>(STORAGE_KEYS.CATALOG_MANIFEST_META, {
      count,
      generated: manifest.generated,
      schema: CACHE_SCHEMA,
    });
  } catch (err) {
    logger.warn('catalog cache write failed', err);
  }
}

/** Drop a chunked snapshot and its meta key. Best-effort. */
async function removeChunked(metaKey: string, chunkPrefix: string, count: number): Promise<void> {
  try {
    const keys = Array.from({ length: count }, (_, i) => `${chunkPrefix}${i}`);
    await AsyncStorage.multiRemove([...keys, metaKey]);
  } catch (err) {
    logger.warn('catalog cache removal failed', err);
  }
}

/**
 * Delete the v1 catalog snapshot. It holds JubileeVerse paths that 404 against
 * the Torah Sings CDN, and on Android its ~2.6 MB eats into a 6 MB AsyncStorage
 * budget the v2 cache now needs. Best-effort and idempotent — a no-op once the
 * v1 meta key is gone.
 */
async function purgeLegacyCache(): Promise<void> {
  try {
    const meta = await storage.getItem<ChunkMeta>(STORAGE_KEYS.LEGACY_CATALOG_MANIFEST_META);
    if (!meta?.count) return;
    await removeChunked(
      STORAGE_KEYS.LEGACY_CATALOG_MANIFEST_META,
      STORAGE_KEYS.LEGACY_CATALOG_MANIFEST_CHUNK,
      meta.count,
    );
  } catch (err) {
    logger.warn('legacy catalog cache purge failed', err);
  }
}

/** Test/diagnostic helper: drop in-memory state so the next call reloads. */
export function resetManifestCache(): void {
  current = null;
  initialLoad = null;
  revalidated = false;
}
