/**
 * Read-aloud, ported from the web's `components/reading/useReadAloud.ts`.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * Same contract as the web:
 *
 * When an Article carries an `audioUrl`, that is a pre-rendered read from the
 * Inspire voice pipeline (Zev-led, with rotating Inspire Family presenters).
 *
 * When `audioUrl` is null, we fall back to the device's own speech synthesis so
 * the feature is never simply missing. It is not the Inspire voice and does not
 * pretend to be; the button says which one you are hearing.
 *
 * The web fallback is `window.speechSynthesis`; the mobile equivalent is
 * `expo-speech`. Every article currently ships `audioUrl: null`, so the device
 * voice is the path that actually runs today.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Sounding natural comes down to four things, all handled here:
 *
 *  1. USE A GOOD VOICE. The OS default is usually the compact, robotic one.
 *     We pick the highest-quality English voice the device actually has.
 *  2. SPEAK WHOLE PARAGRAPHS. Every `Speech.speak()` call is a separate
 *     utterance: the engine resets its prosody and leaves an audible seam. One
 *     utterance per paragraph lets intonation carry across sentences the way a
 *     reader does.
 *  3. PAUSE ON PURPOSE. Silence between paragraphs — and a longer beat before a
 *     heading — is what makes prose sound read rather than recited.
 *  4. FEED IT SPEAKABLE TEXT. Bullet glyphs, verse ranges and dashes are
 *     printed punctuation; spoken aloud they stumble. See `speechText`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import type { Block } from '@/content/articles/types';

export type ReadAloudState = 'idle' | 'speaking' | 'unsupported';
export type ReadAloudVoice = 'inspire' | 'device';

interface UseReadAloudArgs {
  /** Stable id for the piece being read, e.g. "article:the-seventh-thing". */
  id: string;
  blocks: Block[];
  /** Pre-rendered Inspire-voice audio. Null falls back to the device voice. */
  audioUrl: string | null;
}

interface UseReadAloudResult {
  state: ReadAloudState;
  /** Which voice will actually be heard. */
  voice: ReadAloudVoice;
  toggle: () => void;
  stop: () => void;
}

/** One spoken utterance, plus the silence held after it. */
export interface SpeechSegment {
  text: string;
  /** Milliseconds of silence to hold after this segment. */
  pauseAfter: number;
}

// Beats, in ms. Tuned so paragraphs breathe and a heading lands as a new idea.
const PAUSE_SENTENCE_RUN = 0; // mid-paragraph continuation — no seam
const PAUSE_PARAGRAPH = 320;
const PAUSE_AFTER_HEADING = 260;
const PAUSE_BEFORE_HEADING = 700;
const PAUSE_QUOTE = 450;

/**
 * Longest string we hand to one `speak()` call. Android's engine hard-caps
 * input (`maxSpeechInputLength`, typically 4000); iOS reports MAX_VALUE, so we
 * clamp to keep both platforms on the same, sane chunking.
 */
const MAX_UTTERANCE = Math.min(Speech.maxSpeechInputLength || 4000, 3500);

/**
 * Rewrite printed punctuation into something an engine reads well.
 *
 * Bullet glyphs get announced ("bullet") or swallowed depending on the engine;
 * a spaced em dash is an aside, which a comma renders as the right pause; and
 * `1:26–27` is a range, not a subtraction.
 */
function speechText(value: string): string {
  return value
    .replace(/^\s*[•·▪-]\s+/, '') // the list glyph we render is visual only
    .replace(/(\d)\s*[–—-]\s*(\d)/g, '$1 to $2') // verse/number ranges
    .replace(/\s+[–—]\s+/g, ', ') // a spaced dash is an aside
    .replace(/…/g, '. ')
    .replace(/\s+/g, ' ')
    // A quote opening mid-sentence ("…until you return") would otherwise start
    // on a stray full stop.
    .replace(/^[.,;:\s]+/, '')
    .trim();
}

/** Give the engine a full stop to fall on, so lines don't trail upward. */
const ensureStop = (value: string): string => (/[.!?:;,]$/.test(value) ? value : `${value}.`);

/** Split an over-long block on sentence ends so no utterance exceeds the cap. */
function splitLong(text: string): string[] {
  if (text.length <= MAX_UTTERANCE) return [text];
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const out: string[] = [];
  let buffer = '';
  for (const sentence of sentences) {
    if ((buffer + sentence).length > MAX_UTTERANCE && buffer) {
      out.push(buffer.trim());
      buffer = sentence;
    } else {
      buffer += sentence;
    }
  }
  if (buffer.trim()) out.push(buffer.trim());
  return out;
}

/** Turn an article body into utterances with deliberate pauses between them. */
export function toSpeechSegments(blocks: Block[]): SpeechSegment[] {
  const segments: SpeechSegment[] = [];
  const spoken = blocks.filter((b) => b.type !== 'img'); // figures carry no speech

  spoken.forEach((block, i) => {
    const nextIsHeading = spoken[i + 1]?.type === 'h';

    let text: string;
    let pause: number;
    if (block.type === 'h') {
      text = ensureStop(speechText(block.text));
      pause = PAUSE_AFTER_HEADING;
    } else if (block.type === 'quote') {
      const body = ensureStop(speechText(block.text));
      // Citation as its own sentence — read flatly after a beat, not run on.
      text = block.cite ? `${body} ${ensureStop(speechText(block.cite))}` : body;
      pause = PAUSE_QUOTE;
    } else {
      text = ensureStop(speechText(block.text));
      pause = PAUSE_PARAGRAPH;
    }

    if (!text) return;
    // A heading starts a new idea; give it room regardless of what precedes it.
    if (nextIsHeading) pause = Math.max(pause, PAUSE_BEFORE_HEADING);

    const parts = splitLong(text);
    parts.forEach((part, j) => {
      segments.push({
        text: part,
        // Only the final part of a split block carries the block's pause; the
        // rest are mid-thought continuations.
        pauseAfter: j === parts.length - 1 ? pause : PAUSE_SENTENCE_RUN,
      });
    });
  });

  return segments;
}

/**
 * The best English voice on this device: highest quality first, then the
 * closest locale. Without this the engine uses its default, which on most
 * Androids is the compact voice that makes TTS sound synthetic.
 */
export function pickEnglishVoice(voices: Speech.Voice[]): string | undefined {
  const english = voices.filter((v) => v.language?.toLowerCase().startsWith('en'));
  if (english.length === 0) return undefined;

  const score = (v: Speech.Voice): number => {
    let points = 0;
    if (v.quality === Speech.VoiceQuality.Enhanced) points += 8;
    const language = v.language.toLowerCase();
    if (language === 'en-us') points += 3;
    else if (language.startsWith('en-')) points += 1;
    // Android exposes network voices that stall without connectivity.
    if (/network/i.test(v.identifier ?? '')) points -= 4;
    return points;
  };

  return [...english].sort((a, b) => score(b) - score(a))[0]?.identifier;
}

export function useReadAloud({ id, blocks, audioUrl }: UseReadAloudArgs): UseReadAloudResult {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const voiceIdRef = useRef<string | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Bumped on every start/stop so callbacks from a previous read are ignored. */
  const runRef = useRef(0);

  const usingInspireVoice = Boolean(audioUrl);

  // Probed after mount, mirroring the web's `'speechSynthesis' in window` check.
  // Until then we assume support so the button never flickers through a
  // disabled state. This also covers a dev client built before expo-speech was
  // added — the native module is absent, so we say so rather than crash.
  // The same call chooses the voice, rather than throwing the list away.
  useEffect(() => {
    let alive = true;
    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        if (!alive) return;
        voiceIdRef.current = pickEnglishVoice(voices ?? []);
        setSupported(true);
      })
      .catch(() => {
        if (alive) setSupported(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const halt = useCallback(() => {
    runRef.current += 1; // invalidate in-flight callbacks
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    void Speech.stop();
    setSpeaking(false);
  }, []);

  // Never leave a voice talking into an empty room. Keyed on `id` so switching
  // articles mid-read also stops the previous one, not just unmounting.
  useEffect(() => {
    return () => {
      runRef.current += 1;
      if (timerRef.current) clearTimeout(timerRef.current);
      void Speech.stop();
    };
  }, [id]);

  const speakWithDevice = useCallback(() => {
    void Speech.stop();
    const run = (runRef.current += 1);
    const stale = () => run !== runRef.current;

    const segments = toSpeechSegments(blocks);
    if (segments.length === 0) return;

    let index = 0;
    const speakNext = () => {
      if (stale()) return;
      if (index >= segments.length) {
        setSpeaking(false);
        return;
      }
      const segment = segments[index++];
      Speech.speak(segment.text, {
        language: 'en-US',
        voice: voiceIdRef.current,
        // Slightly under conversational pace reads as measured; pitch stays at
        // the engine's designed 1.0, since shifting it is what sounds synthetic.
        rate: 0.95,
        pitch: 1.0,
        onDone: () => {
          if (stale()) return;
          if (segment.pauseAfter > 0) {
            timerRef.current = setTimeout(speakNext, segment.pauseAfter);
          } else {
            speakNext();
          }
        },
        onStopped: () => {
          if (!stale()) setSpeaking(false);
        },
        onError: () => {
          if (!stale()) setSpeaking(false);
        },
      });
    };

    setSpeaking(true);
    speakNext();
  }, [blocks]);

  const toggle = useCallback(() => {
    // The Inspire-voice path belongs on the shared transport (one player, one
    // now-playing bar) and is wired when the pipeline starts rendering audio.
    if (usingInspireVoice) return;

    if (!supported) return;
    if (speaking) halt();
    else speakWithDevice();
  }, [usingInspireVoice, supported, speaking, halt, speakWithDevice]);

  const stop = useCallback(() => {
    if (!usingInspireVoice) halt();
  }, [usingInspireVoice, halt]);

  let state: ReadAloudState;
  if (usingInspireVoice) state = 'idle';
  else if (!supported) state = 'unsupported';
  else state = speaking ? 'speaking' : 'idle';

  return { state, voice: usingInspireVoice ? 'inspire' : 'device', toggle, stop };
}
