import { describe, it, expect } from 'vitest';
import { comboFromEvent } from '../hooks/useHotkeys';

function ev(init: Partial<KeyboardEvent>): KeyboardEvent {
  return new KeyboardEvent('keydown', init);
}

describe('comboFromEvent', () => {
  it('serializes single keys uppercased', () => {
    expect(comboFromEvent(ev({ key: 'a' }))).toBe('A');
    expect(comboFromEvent(ev({ key: 'F1' }))).toBe('F1');
  });

  it('names the space bar', () => {
    expect(comboFromEvent(ev({ key: ' ' }))).toBe('Space');
  });

  it('orders modifiers Ctrl+Alt+Shift+Meta', () => {
    expect(
      comboFromEvent(ev({ key: 'm', ctrlKey: true, altKey: true, shiftKey: true })),
    ).toBe('Ctrl+Alt+Shift+M');
  });

  it('drops bare modifier keypresses', () => {
    expect(comboFromEvent(ev({ key: 'Shift', shiftKey: true }))).toBe('Shift');
  });
});
