/** Format seconds as m:ss (or h:mm:ss for long durations). */
export function formatDuration(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const s = Math.floor(totalSeconds % 60);
  const m = Math.floor((totalSeconds / 60) % 60);
  const h = Math.floor(totalSeconds / 3600);
  const ss = s.toString().padStart(2, '0');
  if (h > 0) {
    const mm = m.toString().padStart(2, '0');
    return `${h}:${mm}:${ss}`;
  }
  return `${m}:${ss}`;
}

/**
 * Truncate a section title for a uniform UI: titles longer than `max` (29 by
 * default) are cut after the first `max` characters and suffixed with an
 * ellipsis. Shorter titles are returned unchanged.
 */
export function truncateTitle(title: string, max = 29): string {
  if (title.length <= max) return title;
  return `${title.slice(0, max)}...`;
}

/** Compact number formatting, e.g. 1200 -> "1.2K", 3_400_000 -> "3.4M". */
export function formatCount(n?: number): string {
  if (n == null) return '';
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}
