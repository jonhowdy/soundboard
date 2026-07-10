// ---------------------------------------------------------------------------
// Domain model for the Soundboard app.
// These types are the single source of truth shared by the store, the audio
// engine, the persistence layer and the UI.
// ---------------------------------------------------------------------------

/** Supported source container formats. Decoding is delegated to the platform. */
export type AudioFormat =
  | 'mp3'
  | 'wav'
  | 'aac'
  | 'm4a'
  | 'ogg'
  | 'flac'
  | 'aiff';

/** How a sound behaves once triggered. */
export type PlayMode = 'oneshot' | 'loop' | 'hold';

/** Per-sound playback configuration applied by the audio engine. */
export interface PlaybackSettings {
  /** Linear gain 0..2 (1 = original volume). */
  volume: number;
  /** Playback rate 0.25..4 (1 = normal speed). Affects pitch unless preservePitch. */
  rate: number;
  /** Semitone pitch shift -12..12, applied independently of rate when supported. */
  pitch: number;
  /** Fade-in duration in seconds. */
  fadeIn: number;
  /** Fade-out duration in seconds. */
  fadeOut: number;
  /** Play the buffer reversed. */
  reverse: boolean;
  /** Loop the buffer until stopped. */
  loop: boolean;
}

export const DEFAULT_PLAYBACK: PlaybackSettings = {
  volume: 1,
  rate: 1,
  pitch: 0,
  fadeIn: 0,
  fadeOut: 0,
  reverse: false,
  loop: false,
};

/** A category / folder that groups sounds and carries a display color. */
export interface Category {
  id: string;
  name: string;
  /** Tailwind-independent hex color used for theming chips and button accents. */
  color: string;
  emoji?: string;
  createdAt: number;
}

/** A single playable sound entity. */
export interface Sound {
  id: string;
  title: string;
  subtitle?: string;
  /** Emoji shown on the button when no image is provided. */
  emoji?: string;
  /** Optional data-URL image (cover art). */
  image?: string;
  /** Hex color for the button background gradient. */
  color: string;
  categoryId: string | null;
  tags: string[];
  favorite: boolean;
  /** Original file format, informational. */
  format: AudioFormat;
  /** Duration in seconds (0 until decoded). */
  duration: number;
  /** Downsampled peaks (0..1) for the waveform preview. */
  waveform: number[];
  playback: PlaybackSettings;
  /** Keyboard hotkey combo, e.g. "F1", "Ctrl+1", "Shift+A", " " (space). */
  hotkey?: string;
  playMode: PlayMode;
  // Statistics
  playCount: number;
  lastPlayed: number | null;
  createdAt: number;
  /** Key into the audio blob store (IndexedDB). */
  blobKey: string;
  /** Id of the sound pack this sound came from, if installed from one. */
  packId?: string;
}

/** A single sound within a downloadable pack. */
export interface PackSoundDef {
  /** Synth voice key used to render the audio offline. */
  synth: string;
  title: string;
  emoji: string;
  tags: string[];
}

/** An installable, versioned sound pack. */
export interface SoundPack {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** Accent color for the pack and its category. */
  color: string;
  /** Category name the pack's sounds are filed under. */
  category: string;
  version: number;
  sounds: PackSoundDef[];
}

export type ThemeId =
  | 'dark'
  | 'light'
  | 'neon'
  | 'retro'
  | 'cyberpunk'
  | 'minimal';

/** The eight themeable color tokens, each an "R G B" triple string. */
export interface ThemeTokens {
  surface: string;
  panel: string;
  elevated: string;
  ink: string;
  muted: string;
  accent: string;
  accent2: string;
  line: string;
}

/** A user-created theme, persisted alongside settings. */
export interface CustomTheme {
  id: string;
  label: string;
  tokens: ThemeTokens;
}

export type GridSize = 2 | 3 | 4 | 5 | 6;

export type RandomScope = 'library' | 'category' | 'favorites';

/** User-facing settings persisted across sessions. */
export interface Settings {
  /** Built-in ThemeId or a custom theme's id. */
  theme: string;
  gridSize: GridSize;
  masterVolume: number;
  haptics: boolean;
  highContrast: boolean;
  colorBlindMode: boolean;
  largeText: boolean;
  showWaveforms: boolean;
  confetti: boolean;
  /** Chosen audio output device id ('' = system default). */
  outputDeviceId: string;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'cyberpunk',
  gridSize: 4,
  masterVolume: 1,
  haptics: true,
  highContrast: false,
  colorBlindMode: false,
  largeText: false,
  showWaveforms: true,
  confetti: false,
  outputDeviceId: '',
};

/** Shape of a full library export / backup file. */
export interface BackupFile {
  version: 1;
  exportedAt: number;
  settings: Settings;
  categories: Category[];
  /** Sounds with the audio embedded as base64 data URLs under `audio`. */
  sounds: (Sound & { audio: string })[];
}

/** A voice active in the audio engine, surfaced for the live mixer. */
export interface ActiveVoice {
  id: string;
  soundId: string;
  title: string;
  startedAt: number;
}
