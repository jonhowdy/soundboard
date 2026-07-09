import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  ActiveVoice,
  BackupFile,
  Category,
  RandomScope,
  Settings,
  Sound,
} from '../types';
import { DEFAULT_PLAYBACK, DEFAULT_SETTINGS } from '../types';
import { storage } from '../db/database';
import { audioEngine, AudioEngine } from '../audio/AudioEngine';
import type { Pcm } from '../audio/edit';
import { encodeWav } from '../utils/wav';
import { hapticTap } from '../platform/haptics';
import { syncStatusBar } from '../platform/native';
import { applyTheme } from '../themes/themes';
import { buildSeed } from '../data/seed';
import {
  arrayBufferToDataUrl,
  dataUrlToArrayBuffer,
  formatFromName,
  titleFromName,
} from '../utils/audioFiles';

export type SortKey = 'recent' | 'name' | 'played' | 'created';

interface State {
  ready: boolean;
  sounds: Sound[];
  categories: Category[];
  settings: Settings;
  activeVoices: ActiveVoice[];

  // UI / filter state
  search: string;
  activeCategory: string | null; // null = all
  favoritesOnly: boolean;
  sort: SortKey;
  editingSoundId: string | null;

  // lifecycle
  init: () => Promise<void>;

  // playback
  playSound: (id: string) => void;
  stopSound: (id: string) => void;
  stopAll: () => void;
  playRandom: (scope: RandomScope) => void;

  // CRUD
  importFiles: (files: FileList | File[]) => Promise<void>;
  addRecording: (blob: Blob, title: string) => Promise<void>;
  updateSound: (id: string, patch: Partial<Sound>) => void;
  ensureSoundLoaded: (id: string) => Promise<boolean>;
  applyAudioEdit: (id: string, pcm: Pcm) => Promise<void>;
  deleteSound: (id: string) => Promise<void>;
  duplicateSound: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => void;

  addCategory: (name: string, color: string, emoji?: string) => void;
  deleteCategory: (id: string) => Promise<void>;

  updateSettings: (patch: Partial<Settings>) => void;
  setVoiceVolume: (voiceId: string, v: number) => void;

  // filter setters
  setSearch: (s: string) => void;
  setActiveCategory: (id: string | null) => void;
  setFavoritesOnly: (v: boolean) => void;
  setSort: (s: SortKey) => void;
  setEditingSound: (id: string | null) => void;

  // backup
  exportBackup: () => Promise<BackupFile>;
  importBackup: (backup: BackupFile) => Promise<void>;

  // derived
  visibleSounds: () => Sound[];
}

/** Ensure a sound's audio is decoded, then compute duration + waveform once. */
async function ensureLoaded(sound: Sound): Promise<Partial<Sound> | null> {
  if (audioEngine.isLoaded(sound.id)) return null;
  const data = await storage.getBlob(sound.blobKey);
  if (!data) return null;
  const buffer = await audioEngine.load(sound.id, data);
  if (sound.duration === 0 || sound.waveform.length === 0) {
    return {
      duration: buffer.duration,
      waveform: AudioEngine.computeWaveform(buffer),
    };
  }
  return null;
}

export const useStore = create<State>((set, get) => ({
  ready: false,
  sounds: [],
  categories: [],
  settings: DEFAULT_SETTINGS,
  activeVoices: [],
  search: '',
  activeCategory: null,
  favoritesOnly: false,
  sort: 'recent',
  editingSoundId: null,

  init: async () => {
    // Wire the engine → store bridge for the live mixer.
    audioEngine.onVoicesChanged = (voices) => set({ activeVoices: voices });

    let settings = (await storage.getSettings()) ?? DEFAULT_SETTINGS;
    settings = { ...DEFAULT_SETTINGS, ...settings };
    applyTheme(settings.theme);
    audioEngine.setMasterVolume(settings.masterVolume);
    if (settings.outputDeviceId) void audioEngine.setOutputDevice(settings.outputDeviceId);

    const seeded = await storage.getFlag('seeded');
    if (!seeded) {
      const { categories, sounds } = buildSeed();
      for (const c of categories) await storage.putCategory(c);
      for (const { sound, audio } of sounds) {
        await storage.putBlob(sound.blobKey, audio);
        await storage.putSound(sound);
      }
      await storage.setFlag('seeded', true);
    }

    const [sounds, categories] = await Promise.all([
      storage.getSounds(),
      storage.getCategories(),
    ]);

    set({ sounds, categories, settings, ready: true });

    // Decode buffers in the background so first taps are instant.
    void (async () => {
      for (const s of sounds) {
        const patch = await ensureLoaded(s);
        if (patch) {
          const next = { ...s, ...patch };
          await storage.putSound(next);
          set((st) => ({
            sounds: st.sounds.map((x) => (x.id === s.id ? next : x)),
          }));
        }
      }
    })();
  },

  playSound: (id) => {
    const sound = get().sounds.find((s) => s.id === id);
    if (!sound) return;
    audioEngine.unlock();

    const start = () => {
      audioEngine.play(id, sound.playback, { title: sound.title });
      const next: Sound = {
        ...sound,
        playCount: sound.playCount + 1,
        lastPlayed: Date.now(),
      };
      void storage.putSound(next);
      set((st) => ({ sounds: st.sounds.map((s) => (s.id === id ? next : s)) }));
      if (get().settings.haptics) hapticTap();
    };

    if (!audioEngine.isLoaded(id)) {
      void ensureLoaded(sound).then(start);
    } else {
      start();
    }
  },

  stopSound: (id) => audioEngine.stopSound(id),
  stopAll: () => audioEngine.stopAll(),

  playRandom: (scope) => {
    const { sounds, activeCategory } = get();
    let pool = sounds;
    if (scope === 'favorites') pool = sounds.filter((s) => s.favorite);
    else if (scope === 'category' && activeCategory)
      pool = sounds.filter((s) => s.categoryId === activeCategory);
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)]!;
    get().playSound(pick.id);
  },

  importFiles: async (files) => {
    const list = Array.from(files);
    const added: Sound[] = [];
    for (const file of list) {
      const buf = await file.arrayBuffer();
      const blobKey = nanoid();
      await storage.putBlob(blobKey, buf);
      let duration = 0;
      let waveform: number[] = [];
      try {
        const id = nanoid();
        const buffer = await audioEngine.load(id, buf);
        duration = buffer.duration;
        waveform = AudioEngine.computeWaveform(buffer);
        audioEngine.unload(id);
      } catch {
        /* undecodable formats still import; decode lazily later */
      }
      const sound: Sound = {
        id: nanoid(),
        title: titleFromName(file.name),
        color: pickColor(added.length),
        emoji: '🔊',
        categoryId: get().activeCategory,
        tags: [],
        favorite: false,
        format: formatFromName(file.name),
        duration,
        waveform,
        playback: { ...DEFAULT_PLAYBACK },
        playMode: 'oneshot',
        playCount: 0,
        lastPlayed: null,
        createdAt: Date.now() + added.length,
        blobKey,
      };
      await storage.putSound(sound);
      // Move the decoded buffer under the final id.
      if (duration > 0) await audioEngine.load(sound.id, buf);
      added.push(sound);
    }
    set((st) => ({ sounds: [...st.sounds, ...added] }));
  },

  addRecording: async (blob, title) => {
    const buf = await blob.arrayBuffer();
    const blobKey = nanoid();
    await storage.putBlob(blobKey, buf);
    const id = nanoid();
    let duration = 0;
    let waveform: number[] = [];
    try {
      const buffer = await audioEngine.load(id, buf);
      duration = buffer.duration;
      waveform = AudioEngine.computeWaveform(buffer);
    } catch {
      /* ignore */
    }
    const sound: Sound = {
      id,
      title: title || 'Recording',
      subtitle: 'Recorded',
      color: '#ef4444',
      emoji: '🎙️',
      categoryId: get().activeCategory,
      tags: ['recording'],
      favorite: false,
      format: 'wav',
      duration,
      waveform,
      playback: { ...DEFAULT_PLAYBACK },
      playMode: 'oneshot',
      playCount: 0,
      lastPlayed: null,
      createdAt: Date.now(),
      blobKey,
    };
    await storage.putSound(sound);
    set((st) => ({ sounds: [...st.sounds, sound] }));
  },

  updateSound: (id, patch) => {
    const sound = get().sounds.find((s) => s.id === id);
    if (!sound) return;
    const next = { ...sound, ...patch };
    void storage.putSound(next);
    set((st) => ({ sounds: st.sounds.map((s) => (s.id === id ? next : s)) }));
  },

  ensureSoundLoaded: async (id) => {
    const sound = get().sounds.find((s) => s.id === id);
    if (!sound) return false;
    if (audioEngine.isLoaded(id)) return true;
    const patch = await ensureLoaded(sound);
    if (patch) {
      const next = { ...sound, ...patch };
      await storage.putSound(next);
      set((st) => ({ sounds: st.sounds.map((s) => (s.id === id ? next : s)) }));
    }
    return audioEngine.isLoaded(id);
  },

  applyAudioEdit: async (id, pcm) => {
    const sound = get().sounds.find((s) => s.id === id);
    if (!sound) return;
    audioEngine.stopSound(id);
    // Re-encode the edited audio to WAV, replace the blob under the same key,
    // swap the cached buffer, and refresh derived duration + waveform.
    const wav = encodeWav(pcm.channels, pcm.sampleRate);
    await storage.putBlob(sound.blobKey, wav);
    const buffer = audioEngine.setPcm(id, pcm);
    const next: Sound = {
      ...sound,
      format: 'wav',
      duration: buffer.duration,
      waveform: AudioEngine.computeWaveform(buffer),
    };
    await storage.putSound(next);
    set((st) => ({ sounds: st.sounds.map((s) => (s.id === id ? next : s)) }));
  },

  deleteSound: async (id) => {
    const sound = get().sounds.find((s) => s.id === id);
    if (!sound) return;
    audioEngine.stopSound(id);
    audioEngine.unload(id);
    await storage.deleteSound(id);
    await storage.deleteBlob(sound.blobKey);
    set((st) => ({ sounds: st.sounds.filter((s) => s.id !== id) }));
  },

  duplicateSound: async (id) => {
    const sound = get().sounds.find((s) => s.id === id);
    if (!sound) return;
    const data = await storage.getBlob(sound.blobKey);
    if (!data) return;
    const blobKey = nanoid();
    await storage.putBlob(blobKey, data);
    const copy: Sound = {
      ...sound,
      id: nanoid(),
      title: `${sound.title} copy`,
      hotkey: undefined,
      favorite: false,
      playCount: 0,
      lastPlayed: null,
      createdAt: Date.now(),
      blobKey,
    };
    await storage.putSound(copy);
    set((st) => ({ sounds: [...st.sounds, copy] }));
  },

  toggleFavorite: (id) => {
    const sound = get().sounds.find((s) => s.id === id);
    if (sound) get().updateSound(id, { favorite: !sound.favorite });
  },

  addCategory: (name, color, emoji) => {
    const cat: Category = { id: nanoid(), name, color, emoji, createdAt: Date.now() };
    void storage.putCategory(cat);
    set((st) => ({ categories: [...st.categories, cat] }));
  },

  deleteCategory: async (id) => {
    await storage.deleteCategory(id);
    // Orphaned sounds fall back to "uncategorized".
    for (const s of get().sounds.filter((s) => s.categoryId === id)) {
      get().updateSound(s.id, { categoryId: null });
    }
    set((st) => ({
      categories: st.categories.filter((c) => c.id !== id),
      activeCategory: st.activeCategory === id ? null : st.activeCategory,
    }));
  },

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    void storage.putSettings(settings);
    if (patch.theme) {
      applyTheme(patch.theme);
      void syncStatusBar(patch.theme);
    }
    if (patch.masterVolume !== undefined)
      audioEngine.setMasterVolume(patch.masterVolume);
    if (patch.outputDeviceId !== undefined)
      void audioEngine.setOutputDevice(patch.outputDeviceId);
    set({ settings });
  },

  setVoiceVolume: (voiceId, v) => audioEngine.setVoiceVolume(voiceId, v),

  setSearch: (search) => set({ search }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setFavoritesOnly: (favoritesOnly) => set({ favoritesOnly }),
  setSort: (sort) => set({ sort }),
  setEditingSound: (editingSoundId) => set({ editingSoundId }),

  exportBackup: async () => {
    const { sounds, categories, settings } = get();
    const withAudio = await Promise.all(
      sounds.map(async (s) => {
        const data = await storage.getBlob(s.blobKey);
        return { ...s, audio: data ? arrayBufferToDataUrl(data) : '' };
      }),
    );
    return {
      version: 1,
      exportedAt: Date.now(),
      settings,
      categories,
      sounds: withAudio,
    };
  },

  importBackup: async (backup) => {
    for (const c of backup.categories) await storage.putCategory(c);
    const restored: Sound[] = [];
    for (const s of backup.sounds) {
      const { audio, ...sound } = s;
      if (audio) {
        const buf = dataUrlToArrayBuffer(audio);
        await storage.putBlob(sound.blobKey, buf);
      }
      await storage.putSound(sound);
      restored.push(sound);
    }
    get().updateSettings(backup.settings);
    set((st) => {
      const map = new Map(st.sounds.map((x) => [x.id, x]));
      for (const s of restored) map.set(s.id, s);
      const catMap = new Map(st.categories.map((x) => [x.id, x]));
      for (const c of backup.categories) catMap.set(c.id, c);
      return { sounds: [...map.values()], categories: [...catMap.values()] };
    });
  },

  visibleSounds: () => {
    const { sounds, search, activeCategory, favoritesOnly, sort, categories } = get();
    const q = search.trim().toLowerCase();
    const catName = (id: string | null) =>
      categories.find((c) => c.id === id)?.name.toLowerCase() ?? '';

    let list = sounds.filter((s) => {
      if (favoritesOnly && !s.favorite) return false;
      if (activeCategory && s.categoryId !== activeCategory) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        (s.subtitle?.toLowerCase().includes(q) ?? false) ||
        s.tags.some((t) => t.toLowerCase().includes(q)) ||
        catName(s.categoryId).includes(q)
      );
    });

    const sorters: Record<SortKey, (a: Sound, b: Sound) => number> = {
      recent: (a, b) => (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0),
      name: (a, b) => a.title.localeCompare(b.title),
      played: (a, b) => b.playCount - a.playCount,
      created: (a, b) => b.createdAt - a.createdAt,
    };
    list = [...list].sort(sorters[sort]);
    // Favorites always pinned to the top.
    return list.sort((a, b) => Number(b.favorite) - Number(a.favorite));
  },
}));

const PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e',
];
export function pickColor(i: number): string {
  return PALETTE[i % PALETTE.length]!;
}
export { PALETTE };
