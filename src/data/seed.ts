import { nanoid } from 'nanoid';
import type { Category, Sound } from '../types';
import { DEFAULT_PLAYBACK } from '../types';
import { SYNTH_SOUNDS } from '../utils/synth';

export interface SeedResult {
  categories: Category[];
  sounds: { sound: Sound; audio: ArrayBuffer }[];
}

const now = () => Date.now();

/**
 * Build the first-run library from synthesized effects so the board is fully
 * functional offline. Runs once (guarded by a persisted flag in the store).
 */
export function buildSeed(): SeedResult {
  const cats: Category[] = [
    { id: nanoid(), name: 'Air Horns', color: '#f43f5e', emoji: '📣', createdAt: now() },
    { id: nanoid(), name: 'Applause', color: '#22c55e', emoji: '👏', createdAt: now() },
    { id: nanoid(), name: 'Funny', color: '#eab308', emoji: '😂', createdAt: now() },
    { id: nanoid(), name: 'Gaming', color: '#6366f1', emoji: '🎮', createdAt: now() },
    { id: nanoid(), name: 'Music', color: '#ec4899', emoji: '🎵', createdAt: now() },
  ];
  const [airHorns, applause, funny, gaming, music] = cats as [
    Category, Category, Category, Category, Category,
  ];

  const defs: {
    key: keyof typeof SYNTH_SOUNDS;
    title: string;
    emoji: string;
    color: string;
    cat: Category;
    tags: string[];
    fav?: boolean;
  }[] = [
    { key: 'airhorn', title: 'Air Horn', emoji: '📣', color: '#f43f5e', cat: airHorns, tags: ['horn', 'hype'], fav: true },
    { key: 'applause', title: 'Applause', emoji: '👏', color: '#22c55e', cat: applause, tags: ['crowd', 'clap'], fav: true },
    { key: 'ding', title: 'Ding', emoji: '🔔', color: '#38bdf8', cat: funny, tags: ['correct', 'bell'] },
    { key: 'buzzer', title: 'Buzzer', emoji: '❌', color: '#ef4444', cat: funny, tags: ['wrong', 'fail'] },
    { key: 'laser', title: 'Laser', emoji: '🔫', color: '#a855f7', cat: gaming, tags: ['sci-fi', 'zap'] },
    { key: 'coin', title: 'Coin', emoji: '🪙', color: '#f59e0b', cat: gaming, tags: ['retro', 'mario'], fav: true },
    { key: 'drumroll', title: 'Drumroll', emoji: '🥁', color: '#f97316', cat: music, tags: ['suspense'] },
    { key: 'pop', title: 'Pop', emoji: '🫧', color: '#06b6d4', cat: funny, tags: ['bubble', 'ui'] },
    { key: 'sadtrombone', title: 'Sad Trombone', emoji: '🎺', color: '#eab308', cat: funny, tags: ['fail', 'womp'] },
    { key: 'chime', title: 'Chime', emoji: '✨', color: '#34d399', cat: music, tags: ['success'] },
    { key: 'boing', title: 'Boing', emoji: '🤸', color: '#f472b6', cat: funny, tags: ['bounce', 'cartoon'] },
    { key: 'bell', title: 'Bell', emoji: '🛎️', color: '#fbbf24', cat: music, tags: ['ring'] },
  ];

  const sounds = defs.map((d, i) => {
    const blobKey = nanoid();
    const audio = SYNTH_SOUNDS[d.key]!();
    const sound: Sound = {
      id: nanoid(),
      title: d.title,
      subtitle: d.cat.name,
      emoji: d.emoji,
      color: d.color,
      categoryId: d.cat.id,
      tags: d.tags,
      favorite: d.fav ?? false,
      format: 'wav',
      duration: 0,
      waveform: [],
      playback: { ...DEFAULT_PLAYBACK },
      hotkey: i < 9 ? `${i + 1}` : undefined,
      playMode: 'oneshot',
      playCount: 0,
      lastPlayed: null,
      createdAt: now() + i,
      blobKey,
    };
    return { sound, audio };
  });

  return { categories: cats, sounds };
}
