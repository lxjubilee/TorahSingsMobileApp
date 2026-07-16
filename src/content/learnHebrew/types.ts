/**
 * Learn Hebrew — portable types for the mobile port.
 * Ported from TorahSingswebApp `src/lib/types.ts` + `src/lib/derivation.ts`.
 * Framework-agnostic: no React / React Native imports.
 *
 * `lessons.json` conforms to `LessonAlbum[]`; `aleph-bet.json` to `AlephLetter[]`.
 */

/** One multiple-choice practice question. */
export interface Exercise {
  prompt: string;
  choices: string[];
  answerIndex: number;
  /** Shown after answering — the teaching "why". */
  note: string;
}

export interface Lesson {
  n: number;
  title: string;
  summary: string;
  durationMinutes: number;
  /** Video/audio from the Jubilee pipeline. Null (all of them today) → show the
   *  dashed "Lesson film pending · exercises below are live" note instead. */
  mediaUrl: string | null;
  exercises: Exercise[];
}

/** A course level. Three ship, six lessons each. */
export interface LessonAlbum {
  slug: string;
  title: string;
  subtitle: string;
  level: 1 | 2 | 3;
  /** Zev and Zariah lead. Join with " & " for display. */
  presenters: string[];
  /** Single Hebrew letter shown on the tile. */
  glyph: string;
  /** 0–360. Tints the glyph tile: hsla(hue, 60%, 60%, 0.18) over near-black. */
  hue: number;
  intro: string;
  lessons: Lesson[];
  /** Whole level open without membership (true only for Level 1). */
  freeTier: boolean;
  /** ISO date. Future-dated albums are withheld — see access.ts. */
  releasedAt: string;
}

/** Derived from the subscription state: paid/active → 'member', else 'guest'. */
export type Entitlement = 'guest' | 'member';

export interface AccessResult {
  allowed: boolean;
  /** Why it is locked, phrased for the reader. Empty when allowed. */
  reason: string;
}

/** One letter of the aleph-bet (teaser row + tile tooltips). */
export interface AlephLetter {
  letter: string;
  name: string;
  sense: string;
  value: number;
}
