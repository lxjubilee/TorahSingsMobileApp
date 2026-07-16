// Learn Hebrew content package, ported from the TorahSings web app. The
// curriculum is bundled — the feature works fully offline; only entitlement
// is network-derived.
import lessonsJson from './lessons.json';
import alephBetJson from './aleph-bet.json';
import type { AlephLetter, Entitlement, LessonAlbum } from './types';

/** Full curriculum: 3 lesson albums × 6 lessons × 3 exercises. */
export const lessonAlbums = lessonsJson as LessonAlbum[];

/** The 22-letter table (letter, name, pictographic sense, value). */
export const alephBet = alephBetJson as AlephLetter[];

/** Map the app's plan entitlement to the web's viewer model (fail-safe: guest). */
export const toEntitlement = (isPaid: boolean): Entitlement => (isPaid ? 'member' : 'guest');

export * from './types';
export * from './access';
