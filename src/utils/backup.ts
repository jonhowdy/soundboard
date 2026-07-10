import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import type { BackupFile, Category, Settings, Sound } from '../types';

/**
 * Portable ZIP archive format for the library. Unlike the JSON backup (which
 * base64-embeds audio), the ZIP stores a `manifest.json` plus the raw audio
 * files under `audio/`, so it's compact and the audio is usable on its own.
 */
export interface ZipManifest {
  version: 1;
  exportedAt: number;
  settings: Settings;
  categories: Category[];
  /** Sounds with audio referenced by path instead of embedded. */
  sounds: (Sound & { file: string })[];
}

export function audioPath(sound: Sound): string {
  return `audio/${sound.id}.${sound.format}`;
}

/** Bundle a manifest + raw audio buffers into a ZIP (Uint8Array). */
export function buildLibraryZip(
  manifest: ZipManifest,
  audio: Record<string, Uint8Array>,
): Uint8Array {
  const files: Record<string, Uint8Array> = {
    'manifest.json': strToU8(JSON.stringify(manifest, null, 2)),
  };
  for (const [path, bytes] of Object.entries(audio)) files[path] = bytes;
  return zipSync(files, { level: 6 });
}

/** Read a library ZIP back into its manifest and audio buffers. */
export function parseLibraryZip(bytes: Uint8Array): {
  manifest: ZipManifest;
  audio: Record<string, Uint8Array>;
} {
  const files = unzipSync(bytes);
  const manifestBytes = files['manifest.json'];
  if (!manifestBytes) throw new Error('manifest.json missing from archive');
  const manifest = JSON.parse(strFromU8(manifestBytes)) as ZipManifest;
  if (manifest.version !== 1) throw new Error('Unsupported archive version');
  const audio: Record<string, Uint8Array> = {};
  for (const [path, data] of Object.entries(files)) {
    if (path.startsWith('audio/')) audio[path] = data;
  }
  return { manifest, audio };
}

/** Escape a CSV field per RFC 4180 (quote when it contains "," | '"' | newline). */
function csvField(value: string | number | boolean): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Produce a spreadsheet-friendly CSV of sound metadata (no audio). */
export function buildCsv(sounds: Sound[], categories: Category[]): string {
  const catName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? '';
  const header = [
    'Title', 'Subtitle', 'Category', 'Tags', 'Favorite',
    'Duration (s)', 'Play count', 'Hotkey', 'Format',
  ];
  const rows = sounds.map((s) =>
    [
      s.title,
      s.subtitle ?? '',
      catName(s.categoryId),
      s.tags.join(' '),
      s.favorite,
      s.duration.toFixed(2),
      s.playCount,
      s.hotkey ?? '',
      s.format,
    ].map(csvField).join(','),
  );
  return [header.map(csvField).join(','), ...rows].join('\n');
}

/** A lightweight summary of a stored backup, kept in an index for fast listing. */
export interface BackupSummary {
  id: string;
  createdAt: number;
  auto: boolean;
  label?: string;
  sounds: number;
  categories: number;
}

export function summarize(id: string, backup: BackupFile, auto: boolean, label?: string): BackupSummary {
  return {
    id,
    createdAt: backup.exportedAt,
    auto,
    label,
    sounds: backup.sounds.length,
    categories: backup.categories.length,
  };
}

/**
 * Keep the newest `max` backups; return the survivors plus the ids to delete.
 * Manual (non-auto) backups are always kept regardless of the cap.
 */
export function pruneBackups(
  index: BackupSummary[],
  max: number,
): { kept: BackupSummary[]; removed: string[] } {
  const sorted = [...index].sort((a, b) => b.createdAt - a.createdAt);
  const kept: BackupSummary[] = [];
  const removed: string[] = [];
  let autoKept = 0;
  for (const b of sorted) {
    if (!b.auto) {
      kept.push(b);
      continue;
    }
    if (autoKept < max) {
      kept.push(b);
      autoKept++;
    } else {
      removed.push(b.id);
    }
  }
  return { kept, removed };
}
