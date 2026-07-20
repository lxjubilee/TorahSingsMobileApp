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

/** TTS engines truncate long utterances. Break the body into speakable pieces. */
export function toUtteranceChunks(blocks: Block[]): string[] {
  const chunks: string[] = [];

  for (const block of blocks) {
    const text = block.type === 'quote' ? `${block.text} — ${block.cite}` : block.text;

    // Split on sentence ends, then recombine up to a safe length.
    const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
    let buffer = '';
    for (const sentence of sentences) {
      if ((buffer + sentence).length > 200 && buffer) {
        chunks.push(buffer.trim());
        buffer = sentence;
      } else {
        buffer += sentence;
      }
    }
    if (buffer.trim()) chunks.push(buffer.trim());
  }

  return chunks.filter(Boolean);
}

export function useReadAloud({ id, blocks, audioUrl }: UseReadAloudArgs): UseReadAloudResult {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const cancelledRef = useRef(false);

  const usingInspireVoice = Boolean(audioUrl);

  // Probed after mount, mirroring the web's `'speechSynthesis' in window` check.
  // Until then we assume support so the button never flickers through a
  // disabled state. This also covers a dev client built before expo-speech was
  // added — the native module is absent, so we say so rather than crash.
  useEffect(() => {
    let alive = true;
    Speech.getAvailableVoicesAsync()
      .then(() => {
        if (alive) setSupported(true);
      })
      .catch(() => {
        if (alive) setSupported(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const stopDeviceVoice = useCallback(() => {
    cancelledRef.current = true;
    Speech.stop();
    setSpeaking(false);
  }, []);

  // Never leave a voice talking into an empty room. Keyed on `id` so switching
  // articles mid-read also stops the previous one, not just unmounting.
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      Speech.stop();
      setSpeaking(false);
    };
  }, [id]);

  const speakWithDevice = useCallback(() => {
    Speech.stop();
    cancelledRef.current = false;

    const chunks = toUtteranceChunks(blocks);
    if (chunks.length === 0) return;

    let index = 0;

    const speakNext = () => {
      if (cancelledRef.current || index >= chunks.length) {
        setSpeaking(false);
        return;
      }
      Speech.speak(chunks[index++], {
        language: 'en-US',
        rate: 0.92, // measured, unhurried
        pitch: 0.95,
        onDone: speakNext,
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
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
    if (speaking) stopDeviceVoice();
    else speakWithDevice();
  }, [usingInspireVoice, supported, speaking, stopDeviceVoice, speakWithDevice]);

  const stop = useCallback(() => {
    if (!usingInspireVoice) stopDeviceVoice();
  }, [usingInspireVoice, stopDeviceVoice]);

  let state: ReadAloudState;
  if (usingInspireVoice) state = 'idle';
  else if (!supported) state = 'unsupported';
  else state = speaking ? 'speaking' : 'idle';

  return { state, voice: usingInspireVoice ? 'inspire' : 'device', toggle, stop };
}
