import { describe, it, expect } from 'vitest';
import {
  buildLibraryZip,
  parseLibraryZip,
  buildCsv,
  pruneBackups,
  type ZipManifest,
  type BackupSummary,
} from '../utils/backup';
import { DEFAULT_PLAYBACK, DEFAULT_SETTINGS } from '../types';
import type { Sound } from '../types';

function sound(p: Partial<Sound> & { id: string; title: string }): Sound {
  return {
    emoji: '🔊', color: '#fff', categoryId: null, tags: [], favorite: false,
    format: 'wav', duration: 1, waveform: [], playback: { ...DEFAULT_PLAYBACK },
    playMode: 'oneshot', playCount: 0, lastPlayed: null, createdAt: 0,
    blobKey: p.id, ...p,
  };
}

describe('library ZIP', () => {
  it('round-trips a manifest and audio buffers', () => {
    const manifest: ZipManifest = {
      version: 1,
      exportedAt: 123,
      settings: DEFAULT_SETTINGS,
      categories: [{ id: 'c1', name: 'Memes', color: '#f00', createdAt: 0 }],
      sounds: [{ ...sound({ id: 'a', title: 'Air Horn' }), file: 'audio/a.wav' }],
    };
    const bytes = new Uint8Array([1, 2, 3, 4, 250, 0, 255]);
    const zip = buildLibraryZip(manifest, { 'audio/a.wav': bytes });

    const { manifest: back, audio } = parseLibraryZip(zip);
    expect(back.sounds[0]!.title).toBe('Air Horn');
    expect(back.categories[0]!.name).toBe('Memes');
    expect([...audio['audio/a.wav']!]).toEqual([1, 2, 3, 4, 250, 0, 255]);
  });

  it('rejects an archive without a manifest', () => {
    const zip = buildLibraryZip(
      { version: 1, exportedAt: 0, settings: DEFAULT_SETTINGS, categories: [], sounds: [] },
      {},
    );
    // Corrupt: parse random bytes
    expect(() => parseLibraryZip(new Uint8Array([0, 1, 2]))).toThrow();
    // Sanity: the good one parses
    expect(parseLibraryZip(zip).manifest.version).toBe(1);
  });
});

describe('buildCsv', () => {
  it('emits a header and one row per sound with escaping', () => {
    const cats = [{ id: 'c1', name: 'Movie, Quotes', color: '#0f0', createdAt: 0 }];
    const csv = buildCsv(
      [sound({ id: 'a', title: 'Say "hi"', categoryId: 'c1', tags: ['x', 'y'], favorite: true })],
      cats,
    );
    const lines = csv.split('\n');
    expect(lines[0]).toContain('Title');
    expect(lines[1]).toContain('"Say ""hi"""'); // quote escaping
    expect(lines[1]).toContain('"Movie, Quotes"'); // comma escaping
    expect(lines[1]).toContain('x y'); // tags joined
  });
});

describe('pruneBackups', () => {
  const mk = (id: string, createdAt: number, auto: boolean): BackupSummary => ({
    id, createdAt, auto, sounds: 1, categories: 1,
  });

  it('keeps the newest N auto backups and drops the rest', () => {
    const idx = [mk('1', 100, true), mk('2', 200, true), mk('3', 300, true)];
    const { kept, removed } = pruneBackups(idx, 2);
    expect(removed).toEqual(['1']); // oldest auto dropped
    expect(kept.map((b) => b.id).sort()).toEqual(['2', '3']);
  });

  it('never prunes manual backups', () => {
    const idx = [mk('1', 100, false), mk('2', 200, true), mk('3', 300, true), mk('4', 400, true)];
    const { kept, removed } = pruneBackups(idx, 1);
    expect(kept.some((b) => b.id === '1')).toBe(true); // manual kept
    expect([...removed].sort()).toEqual(['2', '3']); // only auto beyond cap removed
  });
});
