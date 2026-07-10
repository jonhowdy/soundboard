import type { SoundPack } from '../types';
import { SYNTH_SOUNDS } from '../utils/synth';

/**
 * The built-in sound-pack catalog. Every pack renders its audio offline from the
 * synth palette, so packs install with zero network. New downloadable packs
 * would follow the same `SoundPack` shape (with audio fetched + cached instead
 * of synthesized).
 */
export const PACKS: SoundPack[] = [
  {
    id: 'retro-arcade',
    name: 'Retro Arcade',
    description: '8-bit blips, coins and power-ups for gaming streams.',
    emoji: '🕹️',
    color: '#6366f1',
    category: 'Retro Games',
    version: 1,
    sounds: [
      { synth: 'coin', title: 'Coin', emoji: '🪙', tags: ['retro', 'pickup'] },
      { synth: 'powerup', title: 'Power Up', emoji: '⭐', tags: ['retro', 'buff'] },
      { synth: 'jump', title: 'Jump', emoji: '🦘', tags: ['retro', 'hop'] },
      { synth: 'laser', title: 'Laser', emoji: '🔫', tags: ['retro', 'shoot'] },
      { synth: 'oneup', title: '1-Up', emoji: '🍄', tags: ['retro', 'life'] },
      { synth: 'gameover', title: 'Game Over', emoji: '💀', tags: ['retro', 'lose'] },
    ],
  },
  {
    id: 'drum-kit',
    name: 'Drum Kit',
    description: 'Kick, snare, hats and cymbals to build beats or punctuate bits.',
    emoji: '🥁',
    color: '#f97316',
    category: 'Drums',
    version: 1,
    sounds: [
      { synth: 'kick', title: 'Kick', emoji: '🦵', tags: ['drum', 'bass'] },
      { synth: 'snare', title: 'Snare', emoji: '🥁', tags: ['drum'] },
      { synth: 'hihat', title: 'Hi-Hat', emoji: '🎩', tags: ['drum', 'cymbal'] },
      { synth: 'cymbal', title: 'Crash', emoji: '💥', tags: ['drum', 'cymbal'] },
      { synth: 'cowbell', title: 'Cowbell', emoji: '🔔', tags: ['drum', 'more'] },
      { synth: 'rimshot', title: 'Rimshot', emoji: '🥢', tags: ['drum', 'joke'] },
    ],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Clean UI dings and alerts for streams, apps and alerts.',
    emoji: '🔔',
    color: '#06b6d4',
    category: 'Notifications',
    version: 1,
    sounds: [
      { synth: 'ding', title: 'Ding', emoji: '🔔', tags: ['ui', 'alert'] },
      { synth: 'notify', title: 'Notify', emoji: '📲', tags: ['ui', 'message'] },
      { synth: 'chime', title: 'Chime', emoji: '✨', tags: ['ui', 'success'] },
      { synth: 'pop', title: 'Pop', emoji: '🫧', tags: ['ui'] },
      { synth: 'alert', title: 'Alert', emoji: '🚨', tags: ['ui', 'warning'] },
      { synth: 'sonar', title: 'Sonar', emoji: '📡', tags: ['ui', 'ping'] },
    ],
  },
  {
    id: 'podcast-fx',
    name: 'Podcast FX',
    description: 'Stings and transitions to spice up podcasts and shows.',
    emoji: '🎙️',
    color: '#ec4899',
    category: 'Podcast Effects',
    version: 1,
    sounds: [
      { synth: 'airhorn', title: 'Air Horn', emoji: '📣', tags: ['hype'] },
      { synth: 'applause', title: 'Applause', emoji: '👏', tags: ['crowd'] },
      { synth: 'swoosh', title: 'Swoosh', emoji: '💨', tags: ['transition'] },
      { synth: 'drumroll', title: 'Drumroll', emoji: '🥁', tags: ['suspense'] },
      { synth: 'rimshot', title: 'Rimshot', emoji: '🥢', tags: ['joke'] },
      { synth: 'boing', title: 'Boing', emoji: '🤸', tags: ['funny'] },
    ],
  },
  {
    id: 'meme-classics',
    name: 'Meme Classics',
    description: 'The internet greatest hits for maximum comedic timing.',
    emoji: '😂',
    color: '#eab308',
    category: 'Memes',
    version: 1,
    sounds: [
      { synth: 'sadtrombone', title: 'Sad Trombone', emoji: '🎺', tags: ['fail', 'womp'] },
      { synth: 'airhorn', title: 'Air Horn', emoji: '📣', tags: ['hype'] },
      { synth: 'scratch', title: 'Record Scratch', emoji: '💿', tags: ['stop', 'freeze'] },
      { synth: 'buzzer', title: 'Wrong', emoji: '❌', tags: ['fail'] },
      { synth: 'boing', title: 'Boing', emoji: '🤸', tags: ['bounce'] },
      { synth: 'cymbal', title: 'Ba Dum Tss', emoji: '🥁', tags: ['joke'] },
    ],
  },
];

/** Guard used by tests: every pack sound must reference a real synth voice. */
export function packSynthKeysExist(): boolean {
  return PACKS.every((p) => p.sounds.every((s) => s.synth in SYNTH_SOUNDS));
}
