import type { Block } from '@/content/articles/types';
import { getManifest } from '@/services/catalog/manifestClient';
import type { CatalogArticle } from '@/services/catalog/manifestTypes';
import { cdnUrl, logger } from '@/utils';
import { markdownToBlocks } from './markdown';

/**
 * Published articles, served from the catalog manifest.
 *
 * The manifest the app already fetches and caches carries the full article
 * index — title, excerpt, author, reading time and hero image — so listing
 * articles costs no extra network call and works offline from the same snapshot
 * as the music catalog. Only the article BODY is fetched on demand, when a
 * reader opens one.
 */

/** The Hebraic Christianity collection. */
export const HEBRAIC_COLLECTION = 'hebraic';

/** Parsed bodies, keyed by article file. Bodies are immutable per manifest revision. */
const bodies = new Map<string, Block[]>();

/** Every article in a collection, ordered. Empty when the collection is absent. */
export async function getArticles(collection = HEBRAIC_COLLECTION): Promise<CatalogArticle[]> {
  const manifest = await getManifest();
  return manifest.articles?.find((c) => c.slug === collection)?.articles ?? [];
}

/** The collection's display name, e.g. "Hebraic Christianity". */
export async function getCollectionName(collection = HEBRAIC_COLLECTION): Promise<string> {
  const manifest = await getManifest();
  return manifest.articles?.find((c) => c.slug === collection)?.category ?? '';
}

/** One article's metadata by slug, searched across every collection. */
export async function getArticle(slug: string): Promise<CatalogArticle | undefined> {
  const manifest = await getManifest();
  for (const collection of manifest.articles ?? []) {
    const found = collection.articles.find((a) => a.slug === slug);
    if (found) return found;
  }
  return undefined;
}

/**
 * Fetch and parse an article body. Memoised per file, so returning to an article
 * is instant and re-reads cost nothing.
 */
export async function getArticleBlocks(article: CatalogArticle): Promise<Block[]> {
  const cached = bodies.get(article.file);
  if (cached) return cached;

  const res = await fetch(cdnUrl(article.file));
  if (!res.ok) throw new Error(`article ${article.slug} HTTP ${res.status}`);
  // Bodies reference figures by bare filename; every collection keeps them in an
  // `images/` directory beside the Markdown, so the base is the body's folder.
  const imageBase = article.file.replace(/\/[^/]+$/, '/images');
  const blocks = markdownToBlocks(await res.text(), imageBase);
  if (blocks.length === 0) logger.warn(`article ${article.slug} parsed to an empty body`);
  bodies.set(article.file, blocks);
  return blocks;
}

/** Test/diagnostic helper: drop parsed bodies so the next open refetches. */
export function resetArticleCache(): void {
  bodies.clear();
}
