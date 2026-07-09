import { describe, it, expect } from 'vitest';
import { AudioEngine } from '../audio/AudioEngine';

/** Minimal AudioBuffer stand-in exposing getChannelData(). */
function fakeBuffer(data: number[]): AudioBuffer {
  const arr = Float32Array.from(data);
  return {
    length: arr.length,
    duration: arr.length / 44100,
    sampleRate: 44100,
    numberOfChannels: 1,
    getChannelData: () => arr,
  } as unknown as AudioBuffer;
}

describe('AudioEngine.computeWaveform', () => {
  it('returns the requested number of normalized buckets', () => {
    const buf = fakeBuffer(Array.from({ length: 1000 }, (_, i) => Math.sin(i / 5)));
    const peaks = AudioEngine.computeWaveform(buf, 32);
    expect(peaks).toHaveLength(32);
    for (const p of peaks) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it('normalizes so the loudest bucket approaches 1', () => {
    const buf = fakeBuffer([0, 0.1, 0, 0.2, 0, 1, 0, 0.05]);
    const peaks = AudioEngine.computeWaveform(buf, 8);
    expect(Math.max(...peaks)).toBeCloseTo(1, 5);
  });

  it('handles silence without dividing by zero', () => {
    const buf = fakeBuffer(new Array(200).fill(0));
    const peaks = AudioEngine.computeWaveform(buf, 16);
    expect(peaks.every((p) => p === 0)).toBe(true);
  });
});
