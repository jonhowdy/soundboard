import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { isTauri } from '../platform';

/** Serialize a KeyboardEvent into the canonical combo string used for hotkeys. */
export function comboFromEvent(e: KeyboardEvent | React.KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Meta');
  let key = e.key;
  if (key === ' ') key = 'Space';
  else if (key.length === 1) key = key.toUpperCase();
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) parts.push(key);
  return parts.join('+');
}

/**
 * Global keyboard listener that triggers sounds by their assigned hotkey.
 * Ignores events originating from text inputs so typing never fires sounds.
 */
export function useHotkeys(): void {
  const playSound = useStore((s) => s.playSound);
  const stopAll = useStore((s) => s.stopAll);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        stopAll();
        return;
      }

      // On desktop the OS-level global-shortcut plugin triggers sounds (even
      // when unfocused); handling them here too would double-fire.
      if (isTauri()) return;

      const combo = comboFromEvent(e);
      const match = useStore
        .getState()
        .sounds.find((s) => s.hotkey && s.hotkey === combo);
      if (match) {
        e.preventDefault();
        playSound(match.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [playSound, stopAll]);
}
