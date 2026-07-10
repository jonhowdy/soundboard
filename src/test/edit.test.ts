import { describe, it, expect } from 'vitest';
import { trim, normalize, applyFades, reverse, peakOf, pcmDuration, type Pcm } from '../audio/edit';

const SR = 100; // small rate keeps the math readable
function pcm(data: number[]): Pcm {
  return { channels: [Float32Array.from(data)], sampleRate: SR };
}

describe('audio edit ops', () => {
  it('reports duration from frame count', () => {
    expect(pcmDuration(pcm(new Array(150).fill(0)))).toBeCloseTo(1.5);
  });

  it('finds the absolute peak across samples', () => {
    expect(peakOf(pcm([0, -0.7, 0.3, 0.5]))).toBeCloseTo(0.7);
  });

  it('trims to the requested region', () => {
    const p = pcm(Array.from({ length: 100 }, (_, i) => i / 100)); // 1s ramp
    const out = trim(p, 0.25, 0.75); // keep middle 0.5s
    expect(out.channels[0]!.length).toBe(50);
    expect(out.channels[0]![0]).toBeCloseTo(0.25);
  });

  it('is order-tolerant and never yields empty audio', () => {
    const p = pcm(new Array(100).fill(0.1));
    expect(trim(p, 0.8, 0.2).channels[0]!.length).toBe(60); // swapped bounds
    expect(trim(p, 0.5, 0.5).channels[0]!.length).toBe(1); // degenerate → 1 frame
  });

  it('normalizes the loudest sample to the target peak', () => {
    const out = normalize(pcm([0, 0.25, -0.5, 0.1]), 0.99);
    expect(peakOf(out)).toBeCloseTo(0.99, 5);
    // ratios are preserved
    expect(out.channels[0]![1]! / out.channels[0]![2]!).toBeCloseTo(0.25 / -0.5, 5);
  });

  it('leaves silence untouched (no divide-by-zero)', () => {
    const out = normalize(pcm([0, 0, 0]));
    expect(peakOf(out)).toBe(0);
  });

  it('bakes fade-in and fade-out envelopes', () => {
    const p = pcm(new Array(100).fill(1));
    const out = applyFades(p, 0.1, 0.1); // 10 frames each
    expect(out.channels[0]![0]).toBeCloseTo(0); // starts silent
    expect(out.channels[0]![99]).toBeCloseTo(0); // ends silent
    expect(out.channels[0]![50]).toBeCloseTo(1); // untouched middle
  });

  it('reverses sample order', () => {
    const out = reverse(pcm([1, 2, 3, 4]));
    expect([...out.channels[0]!]).toEqual([4, 3, 2, 1]);
  });
});
