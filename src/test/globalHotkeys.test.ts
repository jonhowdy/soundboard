import { describe, it, expect } from 'vitest';
import { toAccelerator } from '../platform/globalHotkeys';

describe('toAccelerator', () => {
  it('maps modifier names to Tauri accelerator tokens', () => {
    expect(toAccelerator('Ctrl+1')).toBe('Control+1');
    expect(toAccelerator('Alt+M')).toBe('Alt+M');
    expect(toAccelerator('Meta+K')).toBe('Super+K');
  });

  it('preserves function keys and multi-modifier order', () => {
    expect(toAccelerator('F1')).toBe('F1');
    expect(toAccelerator('Ctrl+Alt+Shift+M')).toBe('Control+Alt+Shift+M');
  });

  it('passes through Space and bare keys', () => {
    expect(toAccelerator('Space')).toBe('Space');
    expect(toAccelerator('A')).toBe('A');
  });

  it('returns null when there is no non-modifier key', () => {
    expect(toAccelerator('Ctrl')).toBeNull();
    expect(toAccelerator('')).toBeNull();
  });
});
