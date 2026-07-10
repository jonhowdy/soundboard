import type { AudioFormat } from '../types';

const EXT_TO_FORMAT: Record<string, AudioFormat> = {
  mp3: 'mp3',
  wav: 'wav',
  wave: 'wav',
  aac: 'aac',
  m4a: 'm4a',
  ogg: 'ogg',
  oga: 'ogg',
  flac: 'flac',
  aif: 'aiff',
  aiff: 'aiff',
};

export const SUPPORTED_EXTENSIONS = Object.keys(EXT_TO_FORMAT);

export const ACCEPT_ATTR = SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(',');

/** Map a filename to a known AudioFormat, defaulting to mp3. */
export function formatFromName(name: string): AudioFormat {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_FORMAT[ext] ?? 'mp3';
}

export function isSupportedAudioFile(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return ext in EXT_TO_FORMAT;
}

/** Strip extension and prettify a filename into a human title. */
export function titleFromName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  return base
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function arrayBufferToDataUrl(buf: ArrayBuffer, mime = 'audio/mpeg'): string {
  let binary = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

export function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(',')[1] ?? '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
