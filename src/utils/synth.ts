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

  // --- Retro / arcade ---------------------------------------------------------
  powerup: () =>
    render(0.6, (t) => {
      const notes = [392, 523, 659, 784, 1047];
      const f = notes[Math.min(notes.length - 1, Math.floor(t / 0.11))]!;
      return Math.sign(Math.sin(TAU * f * t)) * 0.5;
    }),
  jump: () => render(0.25, (t) => Math.sign(Math.sin(TAU * (400 + 900 * t) * t)) * 0.5),
  gameover: () =>
    render(1.2, (t) => {
      const notes = [523, 392, 330, 262];
      const f = notes[Math.min(notes.length - 1, Math.floor(t / 0.3))]!;
      return Math.sign(Math.sin(TAU * f * t)) * 0.5;
    }),
  oneup: () =>
    render(0.5, (t) => {
      const f = t < 0.12 ? 659 : t < 0.24 ? 784 : t < 0.36 ? 1047 : 1319;
      return Math.sin(TAU * f * t) * 0.6;
    }),

  // --- Drum kit ---------------------------------------------------------------
  kick: () =>
    render(0.35, (t) => Math.sin(TAU * (150 * Math.exp(-t * 24) + 45) * t) * Math.exp(-t * 8)),
  snare: () =>
    render(0.3, (t) =>
      ((Math.random() * 2 - 1) * 0.7 + Math.sin(TAU * 180 * t) * 0.4) * Math.exp(-t * 16),
    ),
  hihat: () => render(0.12, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 60)),
  cymbal: () => render(1.1, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 3.5)),
  cowbell: () =>
    render(0.35, (t) =>
      (Math.sign(Math.sin(TAU * 540 * t)) + Math.sign(Math.sin(TAU * 800 * t))) *
      0.3 * Math.exp(-t * 6),
    ),
  rimshot: () =>
    render(0.2, (t) =>
      (t < 0.02 ? Math.random() * 2 - 1 : Math.sin(TAU * 420 * t)) * Math.exp(-t * 20),
    ),

  // --- Notifications ----------------------------------------------------------
  notify: () =>
    render(0.5, (t) => {
      const f = t < 0.16 ? 784 : 1047;
      return Math.sin(TAU * f * t) * Math.exp(-((t % 0.16)) * 6);
    }),
  alert: () =>
    render(0.8, (t) => Math.sign(Math.sin(TAU * (Math.floor(t * 6) % 2 ? 880 : 660) * t)) * 0.5),
  sonar: () => render(1.4, (t) => Math.sin(TAU * 700 * t) * Math.exp(-t * 3)),

  // --- Transitions / meme -----------------------------------------------------
  swoosh: () =>
    render(0.6, (t) => (Math.random() * 2 - 1) * Math.sin(TAU * 2 * t) * (1 - t / 0.6)),
  scratch: () =>
    render(0.7, (t) => {
      const wob = Math.sin(TAU * 30 * t) * 80;
      return Math.sin(TAU * (220 + wob) * t) * (Math.random() * 0.4 + 0.6);
    }),
};
