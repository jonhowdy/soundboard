import type { Sound } from '../types';
import { isTauri } from './index';

/**
 * Desktop global hotkeys.
 *
 * On the web, hotkeys are handled by a `keydown` listener that only fires while
 * the window is focused (see `hooks/useHotkeys`). On desktop we upgrade to true
 * OS-level shortcuts via Tauri's global-shortcut plugin, so a hotkey triggers a
 * sound even when the app is in the background — the behavior streamers expect.
 *
 * The Tauri plugin is imported lazily so the web bundle never loads it.
 */

/** Accelerators we currently hold registered, so we can diff on each sync. */
let active = new Set<string>();

/**
 * Convert our internal combo format ("Ctrl+Alt+Shift+M", "Space", "F1", "1")
 * into a Tauri accelerator string. Returns null for combos Tauri can't express.
 */
export function toAccelerator(combo: string): string | null {
  const parts = combo.split('+').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const out: string[] = [];
  let key: string | null = null;
  for (const p of parts) {
    switch (p) {
      case 'Ctrl':
        out.push('Control');
        break;
      case 'Alt':
        out.push('Alt');
        break;
      case 'Shift':
        out.push('Shift');
        break;
      case 'Meta':
        out.push('Super');
        break;
      default:
        key = p;
    }
  }
  if (!key) return null;
  // Tauri/global-hotkey accepts A–Z, 0–9, F1–F24, Space, arrows, etc. as-is.
  out.push(key);
  return out.join('+');
}

/**
 * Reconcile the OS global-shortcut registry with the current sound hotkeys.
 * Safe to call repeatedly (e.g. whenever the sound list changes). No-op on web.
 */
export async function syncGlobalHotkeys(
  sounds: Sound[],
  onTrigger: (soundId: string) => void,
): Promise<void> {
  if (!isTauri()) return;
  let gs: typeof import('@tauri-apps/plugin-global-shortcut');
  try {
    gs = await import('@tauri-apps/plugin-global-shortcut');
  } catch {
    return; // plugin unavailable
  }

  const desired = new Map<string, string>();
  for (const s of sounds) {
    if (!s.hotkey) continue;
    const acc = toAccelerator(s.hotkey);
    if (acc) desired.set(acc, s.id);
  }

  // Clear everything we own, then register the desired set. Registration counts
  // are small (one per hotkeyed sound), so a full resync is simplest and avoids
  // stale handlers when a hotkey is reassigned to a different sound.
  try {
    await gs.unregisterAll();
  } catch {
    /* ignore */
  }
  active = new Set();

  for (const [acc, soundId] of desired) {
    try {
      await gs.register(acc, (event) => {
        // The plugin fires on both press and release; act on press only.
        if (event.state === undefined || event.state === 'Pressed') {
          onTrigger(soundId);
        }
      });
      active.add(acc);
    } catch (err) {
      // A single unparseable/occupied accelerator must not break the rest.
      console.warn(`[soundboard] could not register hotkey "${acc}"`, err);
    }
  }
}

/** Release every global shortcut we hold (call on teardown). */
export async function clearGlobalHotkeys(): Promise<void> {
  if (!isTauri() || active.size === 0) return;
  try {
    const gs = await import('@tauri-apps/plugin-global-shortcut');
    await gs.unregisterAll();
  } catch {
    /* ignore */
  }
  active = new Set();
}
