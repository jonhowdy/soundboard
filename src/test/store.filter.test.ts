import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store/useStore';
import { DEFAULT_PLAYBACK } from '../types';
import type { Sound } from '../types';

function make(partial: Partial<Sound> & { id: string; title: string }): Sound {
  return {
    subtitle: undefined,
    emoji: '🔊',
    color: '#fff',
    categoryId: null,
    tags: [],
    favorite: false,
    format: 'mp3',
    duration: 1,
    waveform: [],
    playback: { ...DEFAULT_PLAYBACK },
    playMode: 'oneshot',
    playCount: 0,
    lastPlayed: null,
    createdAt: 0,
    blobKey: partial.id,
    ...partial,
  };
}

describe('store.visibleSounds', () => {
  beforeEach(() => {
    useStore.setState({
      categories: [
        { id: 'c1', name: 'Memes', color: '#f00', createdAt: 0 },
        { id: 'c2', name: 'Music', color: '#0f0', createdAt: 0 },
      ],
      sounds: [
        make({ id: 'a', title: 'Air Horn', tags: ['hype'], categoryId: 'c1', playCount: 5 }),
        make({ id: 'b', title: 'Applause', categoryId: 'c2', favorite: true, playCount: 1 }),
        make({ id: 'c', title: 'Guitar Riff', tags: ['rock'], categoryId: 'c2', playCount: 9 }),
      ],
      search: '',
      activeCategory: null,
      favoritesOnly: false,
      sort: 'name',
    });
  });

  it('pins favorites to the top regardless of sort', () => {
    const ids = useStore.getState().visibleSounds().map((s) => s.id);
    expect(ids[0]).toBe('b'); // the only favorite
  });

  it('filters by search across title, tags and category name', () => {
    useStore.setState({ search: 'rock' });
    expect(useStore.getState().visibleSounds().map((s) => s.id)).toEqual(['c']);
    useStore.setState({ search: 'music' }); // category name
    expect(useStore.getState().visibleSounds().map((s) => s.id).sort()).toEqual(['b', 'c']);
  });

  it('filters by active category', () => {
    useStore.setState({ activeCategory: 'c2', sort: 'name' });
    expect(useStore.getState().visibleSounds().map((s) => s.id).sort()).toEqual(['b', 'c']);
  });

  it('filters favorites only', () => {
    useStore.setState({ favoritesOnly: true });
    expect(useStore.getState().visibleSounds().map((s) => s.id)).toEqual(['b']);
  });

  it('sorts by play count', () => {
    useStore.setState({ sort: 'played', favoritesOnly: false });
    // favorite (b) still pinned first, then by playCount desc
    const ids = useStore.getState().visibleSounds().map((s) => s.id);
    expect(ids[0]).toBe('b');
    expect(ids.slice(1)).toEqual(['c', 'a']);
  });
});
