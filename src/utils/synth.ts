/**
 * Tiny offline synthesizer used to seed the library with real, playable audio
 * so the app is useful on first launch with zero network. Produces 16-bit PCM
 * WAV ArrayBuffers.
 */

import { encodeWav } from './wav';

const SR = 44100;

type Voice = (t: number, dur: number) => number;

function render(dur: number, voice: Voice): ArrayBuffer {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    // Gentle attack/release envelope to avoid clicks.
    const env = Math.min(1, t / 0.01) * Math.min(1, (dur - t) / 0.03);
    out[i] = voice(t, dur) * env * 0.6;
  }
  return encodeWav([out], SR);
}

const TAU = Math.PI * 2;

/** A named palette of synthesized effects. */
export const SYNTH_SOUNDS: Record<string, () => ArrayBuffer> = {
  airhorn: () =>
    render(0.9, (t) => {
      const f = 220 + 40 * Math.sin(TAU * 6 * t);
      return (
        (Math.sign(Math.sin(TAU * f * t)) * 0.5 +
          0.5 * Math.sin(TAU * f * 2 * t)) *
        (t < 0.7 ? 1 : (0.9 - t) / 0.2)
      );
    }),
  applause: () =>
    render(1.6, (t) => {
      // Filtered noise bursts approximating a crowd.
      const swell = Math.min(1, t / 0.4) * Math.min(1, (1.6 - t) / 0.6);
      return (Math.random() * 2 - 1) * swell * 0.8;
    }),
  ding: () =>
    render(0.7, (t) => Math.sin(TAU * 880 * t) + 0.4 * Math.sin(TAU * 1760 * t)),
  buzzer: () =>
    render(0.6, (t) => Math.sign(Math.sin(TAU * 130 * t)) * 0.7),
  laser: () =>
    render(0.5, (t) => Math.sin(TAU * (1200 - 1800 * t) * t)),
  coin: () =>
    render(0.4, (t) =>
      t < 0.08 ? Math.sin(TAU * 988 * t) : Math.sin(TAU * 1319 * t),
    ),
  drumroll: () =>
    render(1.4, (t) => {
      const hit = Math.sin(TAU * 40 * t) * (Math.random() * 2 - 1);
      return hit * (t < 1.1 ? 0.5 + 0.5 * (t / 1.1) : 1);
    }),
  pop: () => render(0.18, (t) => Math.sin(TAU * (600 - 400 * t) * t)),
  sadtrombone: () =>
    render(1.6, (t) => {
      const steps = [233, 220, 196, 175];
      const idx = Math.min(steps.length - 1, Math.floor(t / 0.4));
      const f = steps[idx]!;
      return Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2 * t);
    }),
  chime: () =>
    render(1.2, (t) => {
      const notes = [523, 659, 784];
      let s = 0;
      notes.forEach((f, i) => {
        if (t > i * 0.12) s += Math.sin(TAU * f * t) * Math.exp(-(t - i * 0.12) * 2);
      });
      return s / 2;
    }),
  boing: () =>
    render(0.6, (t) => Math.sin(TAU * (300 + 200 * Math.sin(TAU * 8 * t)) * t)),
  bell: () =>
    render(1.5, (t) =>
      (Math.sin(TAU * 660 * t) + 0.5 * Math.sin(TAU * 1320 * t)) *
      Math.exp(-t * 2.2),
    ),
};
