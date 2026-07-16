/**
 * Learn Hebrew — gating + publication rules, ported VERBATIM from
 * TorahSingswebApp `src/lib/access.ts` and `src/lib/content.ts`.
 * Framework-agnostic. Keep this logic byte-for-byte equivalent so the mobile
 * app and the website always agree on what is open.
 */

import type { AccessResult, Entitlement, LessonAlbum } from './types';

const OPEN: AccessResult = { allowed: true, reason: '' };
const locked = (reason: string): AccessResult => ({ allowed: false, reason });

/* ---- Publication (content.ts) ------------------------------------------ */

/** Anything dated in the future is withheld until its hour comes. */
export function isPublished(releasedAt: string, now: Date = new Date()): boolean {
  const at = new Date(`${releasedAt}T00:00:00Z`).getTime();
  return Number.isFinite(at) && at <= now.getTime();
}

/** Published lesson albums, sorted by level. Feed this the parsed lessons.json. */
export function getLessonAlbums(all: LessonAlbum[], now: Date = new Date()): LessonAlbum[] {
  return all.filter((l) => isPublished(l.releasedAt, now)).sort((a, b) => a.level - b.level);
}

/** Slug lookup goes through the published filter too — unreleased slugs 404. */
export function getLessonAlbum(
  all: LessonAlbum[],
  slug: string,
  now: Date = new Date(),
): LessonAlbum | undefined {
  return getLessonAlbums(all, now).find((l) => l.slug === slug);
}

/* ---- Gating (access.ts) -------------------------------------------------- */

export function canOpenLessonAlbum(lessonAlbum: LessonAlbum, ent: Entitlement): AccessResult {
  if (ent === 'member') return OPEN;
  if (lessonAlbum.freeTier) return OPEN;
  return locked('This level unlocks with membership.');
}

/** Lesson 1 of every level is open — the doorway is never locked. */
export function canOpenLesson(
  lessonAlbum: LessonAlbum,
  lessonNumber: number,
  ent: Entitlement,
): AccessResult {
  if (ent === 'member') return OPEN;
  if (lessonAlbum.freeTier) return OPEN;
  if (lessonNumber === 1) return OPEN;
  return locked('This lesson unlocks with membership.');
}
