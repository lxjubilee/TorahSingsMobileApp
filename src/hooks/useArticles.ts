import { useCallback, useEffect, useState } from 'react';
import { getArticles, HEBRAIC_COLLECTION } from '@/services/articles';
import { onCatalogUpdated } from '@/services/catalog/manifestClient';
import type { CatalogArticle } from '@/services/catalog/manifestTypes';
import { logger } from '@/utils';

export interface UseArticles {
  articles: CatalogArticle[];
  /** True until the first resolution — the manifest may still be downloading. */
  loading: boolean;
  /** The manifest could not be read and no cached snapshot was available. */
  failed: boolean;
}

/**
 * The published articles of a collection, from the cached catalog manifest.
 *
 * Resolves from the persisted snapshot on cold start, then re-reads when a
 * background catalog refresh lands, so a newly published article appears
 * without a restart.
 */
export function useArticles(collection: string = HEBRAIC_COLLECTION): UseArticles {
  const [articles, setArticles] = useState<CatalogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(
    async (alive: () => boolean) => {
      try {
        const next = await getArticles(collection);
        if (!alive()) return;
        setArticles(next);
        setFailed(false);
      } catch (err) {
        logger.warn('articles load failed', err);
        if (alive()) setFailed(true);
      } finally {
        if (alive()) setLoading(false);
      }
    },
    [collection],
  );

  useEffect(() => {
    let mounted = true;
    const alive = () => mounted;

    void load(alive);
    const unsubscribe = onCatalogUpdated(() => void load(alive));

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [load]);

  return { articles, loading, failed };
}
