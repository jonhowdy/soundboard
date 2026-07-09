/**
 * Pure, dependency-free audio-editing operations over a minimal PCM
 * representation. Deliberately decoupled from the Web Audio API so every
 * transform is unit-testable with plain Float32Arrays — no AudioContext needed.
 *
 * The AudioEngine converts its decoded AudioBuffers to/from this shape; storage
 * re-encodes the result to WAV via `utils/wav`.
 */
export interface Pcm {
  channels: Float32Array[];
  sampleRate: number;
}

export function pcmDuration(pcm: Pcm): number {
  const frames = pcm.channels[0]?.length ?? 0;
  return frames / pcm.sampleRate;
}

/** Absolute peak sample magnitude across all channels (0..1). */
export function peakOf(pcm: Pcm): number {
  let peak = 0;
  for (const ch of pcm.channels) {
    for (let i = 0; i < ch.length; i++) {
      const v = Math.abs(ch[i]!);
      if (v > peak) peak = v;
    }
  }
  return peak;
}

/** Keep only the region [startSec, endSec). Clamped and order-tolerant. */
export function trim(pcm: Pcm, startSec: number, endSec: number): Pcm {
  const frames = pcm.channels[0]?.length ?? 0;
  let a = Math.round(Math.min(startSec, endSec) * pcm.sampleRate);
  let b = Math.round(Math.max(startSec, endSec) * pcm.sampleRate);
  a = Math.max(0, Math.min(frames, a));
  b = Math.max(0, Math.min(frames, b));
  if (b <= a) b = Math.min(frames, a + 1); // never produce empty audio
  return {
    sampleRate: pcm.sampleRate,
    channels: pcm.channels.map((ch) => ch.slice(a, b)),
  };
}

/**
 * Scale so the loudest sample reaches `targetPeak` (default −0.1 dBFS ≈ 0.99).
 * Silent input is returned untouched to avoid dividing by zero / blowing up noise.
 */
export function normalize(pcm: Pcm, targetPeak = 0.99): Pcm {
  const peak = peakOf(pcm);
  if (peak === 0) return pcm;
  const gain = targetPeak / peak;
  return {
    sampleRate: pcm.sampleRate,
    channels: pcm.channels.map((ch) => {
      const out = new Float32Array(ch.length);
      for (let i = 0; i < ch.length; i++) out[i] = ch[i]! * gain;
      return out;
    }),
  };
}

/** Bake linear fade-in / fade-out envelopes into the samples. */
export function applyFades(pcm: Pcm, fadeInSec: number, fadeOutSec: number): Pcm {
  const sr = pcm.sampleRate;
  const frames = pcm.channels[0]?.length ?? 0;
  const inN = Math.min(frames, Math.max(0, Math.round(fadeInSec * sr)));
  const outN = Math.min(frames, Math.max(0, Math.round(fadeOutSec * sr)));
  return {
    sampleRate: sr,
    channels: pcm.channels.map((ch) => {
      const out = new Float32Array(ch);
      for (let i = 0; i < inN; i++) out[i] = out[i]! * (i / inN);
      for (let i = 0; i < outN; i++) {
        const idx = frames - 1 - i;
        out[idx] = out[idx]! * (i / outN);
      }
      return out;
    }),
  };
}

/** Reverse every channel in place-safe fashion. */
export function reverse(pcm: Pcm): Pcm {
  return {
    sampleRate: pcm.sampleRate,
    channels: pcm.channels.map((ch) => {
      const out = new Float32Array(ch.length);
      for (let i = 0, n = ch.length; i < n; i++) out[i] = ch[n - 1 - i]!;
      return out;
    }),
  };
}
