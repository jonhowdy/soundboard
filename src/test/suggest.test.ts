import { describe, it, expect } from 'vitest';
import { suggestMeta } from '../utils/suggest';
import { encodeWav } from '../utils/wav';

describe('suggestMeta', () => {
  it('matches keywords to emoji, color and tags', () => {
    const s = suggestMeta('Epic Air Horn');
    expect(s.emoji).toBe('📣');
    expect(s.color).toBe('#f43f5e');
    expect(s.tags).toContain('horn');
  });

  it('falls back gracefully for unknown titles', () => {
    const s = suggestMeta('Zxqv');
    expect(s.emoji).toBe('🔊');
    expect(s.color).toMatch(/^#/);
  });

  it('merges existing tags and drops stop words', () => {
    const s = suggestMeta('The Final Applause Clip', ['crowd']);
    expect(s.tags).toContain('crowd');
    expect(s.tags).toContain('applause');
    expect(s.tags).not.toContain('the');
    expect(s.tags).not.toContain('clip');
    expect(s.tags.length).toBeLessThanOrEqual(8);
  });
});

describe('encodeWav', () => {
  it('writes a valid header and correct data size for stereo', () => {
    const left = Float32Array.from([0, 0.5, -0.5]);
    const right = Float32Array.from([0, -0.5, 0.5]);
    const buf = encodeWav([left, right], 48000);
    const view = new DataView(buf);
    const str = (o: number, n: number) =>
      Array.from({ length: n }, (_, i) => String.fromCharCode(view.getUint8(o + i))).join('');
    expect(str(0, 4)).toBe('RIFF');
    expect(str(8, 4)).toBe('WAVE');
    expect(view.getUint16(22, true)).toBe(2); // channels
    expect(view.getUint32(24, true)).toBe(48000); // sample rate
    // 3 frames * 2 channels * 2 bytes = 12
    expect(view.getUint32(40, true)).toBe(12);
    expect(buf.byteLength).toBe(44 + 12);
  });
});
