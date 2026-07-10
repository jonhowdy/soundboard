import { describe, it, expect } from 'vitest';
import {
  formatFromName,
  titleFromName,
  isSupportedAudioFile,
  arrayBufferToDataUrl,
  dataUrlToArrayBuffer,
} from '../utils/audioFiles';

describe('audioFiles', () => {
  it('maps extensions to formats', () => {
    expect(formatFromName('clip.mp3')).toBe('mp3');
    expect(formatFromName('a.WAV')).toBe('wav');
    expect(formatFromName('b.aiff')).toBe('aiff');
    expect(formatFromName('c.oga')).toBe('ogg');
    expect(formatFromName('unknown.xyz')).toBe('mp3'); // safe default
  });

  it('detects supported files case-insensitively', () => {
    expect(isSupportedAudioFile('sound.FLAC')).toBe(true);
    expect(isSupportedAudioFile('doc.pdf')).toBe(false);
    expect(isSupportedAudioFile('noext')).toBe(false);
  });

  it('prettifies file names into titles', () => {
    expect(titleFromName('epic_air-horn.mp3')).toBe('Epic Air Horn');
    expect(titleFromName('  spaced  out .wav')).toBe('Spaced Out');
  });

  it('round-trips array buffers through data URLs', () => {
    const original = new Uint8Array([0, 1, 2, 250, 128, 255]).buffer;
    const url = arrayBufferToDataUrl(original, 'audio/wav');
    expect(url.startsWith('data:audio/wav;base64,')).toBe(true);
    const back = new Uint8Array(dataUrlToArrayBuffer(url));
    expect([...back]).toEqual([0, 1, 2, 250, 128, 255]);
  });
});
