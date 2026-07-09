import { describe, it, expect } from 'vitest';
import { SYNTH_SOUNDS } from '../utils/synth';

function readStr(view: DataView, offset: number, len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) s += String.fromCharCode(view.getUint8(offset + i));
  return s;
}

describe('synth', () => {
  it('exposes a palette of effects', () => {
    expect(Object.keys(SYNTH_SOUNDS).length).toBeGreaterThanOrEqual(10);
  });

  it('produces valid mono 16-bit PCM WAV buffers', () => {
    for (const [name, make] of Object.entries(SYNTH_SOUNDS)) {
      const buf = make();
      const view = new DataView(buf);
      expect(readStr(view, 0, 4), name).toBe('RIFF');
      expect(readStr(view, 8, 4), name).toBe('WAVE');
      expect(view.getUint16(20, true), name).toBe(1); // PCM
      expect(view.getUint16(22, true), name).toBe(1); // mono
      expect(view.getUint32(24, true), name).toBe(44100); // sample rate
      // data chunk size matches remaining bytes
      const dataLen = view.getUint32(40, true);
      expect(buf.byteLength, name).toBe(44 + dataLen);
    }
  });
});
