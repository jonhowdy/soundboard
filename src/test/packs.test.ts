import { describe, it, expect } from 'vitest';
import { PACKS, packSynthKeysExist } from '../data/packs';
import { SYNTH_SOUNDS } from '../utils/synth';

function readStr(view: DataView, offset: number, len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) s += String.fromCharCode(view.getUint8(offset + i));
  return s;
}

describe('sound pack catalog', () => {
  it('ships several packs', () => {
    expect(PACKS.length).toBeGreaterThanOrEqual(4);
  });

  it('has unique pack ids', () => {
    const ids = PACKS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every pack sound references a real synth voice', () => {
    expect(packSynthKeysExist()).toBe(true);
  });

  it('every pack has a name, category, version and at least one sound', () => {
    for (const p of PACKS) {
      expect(p.name.length, p.id).toBeGreaterThan(0);
      expect(p.category.length, p.id).toBeGreaterThan(0);
      expect(p.version, p.id).toBeGreaterThanOrEqual(1);
      expect(p.sounds.length, p.id).toBeGreaterThan(0);
    }
  });

  it('renders valid WAV audio for every pack sound', () => {
    for (const p of PACKS) {
      for (const s of p.sounds) {
        const buf = SYNTH_SOUNDS[s.synth]!();
        const view = new DataView(buf);
        expect(readStr(view, 0, 4), `${p.id}/${s.synth}`).toBe('RIFF');
        expect(readStr(view, 8, 4), `${p.id}/${s.synth}`).toBe('WAVE');
        expect(buf.byteLength).toBeGreaterThan(44);
      }
    }
  });
});
