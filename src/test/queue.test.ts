import { describe, it, expect, beforeEach } from 'vitest';
import { useStore, moveItem } from '../store/useStore';
import { chunk } from '../utils/array';

describe('moveItem', () => {
  it('moves an item forward and backward', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });
  it('no-ops on out-of-range or identical indices', () => {
    const a = ['a', 'b'];
    expect(moveItem(a, 0, 0)).toBe(a);
    expect(moveItem(a, -1, 1)).toBe(a);
    expect(moveItem(a, 0, 5)).toBe(a);
  });
});

describe('chunk', () => {
  it('splits into pages of the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it('returns one empty-safe page for an empty array', () => {
    expect(chunk([], 4)).toEqual([]);
  });
  it('treats size < 1 as 1', () => {
    expect(chunk([1, 2], 0)).toEqual([[1], [2]]);
  });
});

describe('store queue reducers', () => {
  beforeEach(() => {
    useStore.setState({ queue: [], queuePlaying: false, queueIndex: 0 });
  });

  it('adds, reorders and removes queue items', () => {
    const s = useStore.getState();
    s.addToQueue('a');
    s.addToQueue('b');
    s.addToQueue('c');
    expect(useStore.getState().queue).toEqual(['a', 'b', 'c']);

    useStore.getState().moveInQueue(2, -1); // c up
    expect(useStore.getState().queue).toEqual(['a', 'c', 'b']);

    useStore.getState().removeFromQueue(0); // drop a
    expect(useStore.getState().queue).toEqual(['c', 'b']);
  });

  it('clears the queue', () => {
    useStore.getState().addToQueue('a');
    useStore.getState().clearQueue();
    expect(useStore.getState().queue).toEqual([]);
  });

  it('keeps duplicates (same sound can be queued twice)', () => {
    useStore.getState().addToQueue('a');
    useStore.getState().addToQueue('a');
    expect(useStore.getState().queue).toEqual(['a', 'a']);
  });
});
