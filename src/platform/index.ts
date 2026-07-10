import { Capacitor } from '@capacitor/core';

/**
 * Platform detection. The same bundle runs as a web PWA, inside the Tauri
 * desktop shell, and inside the Capacitor iOS/Android shell; this module lets
 * feature code branch without importing platform APIs on the web path.
 */

export type Platform = 'web' | 'desktop' | 'ios' | 'android';

/** True when running inside the Tauri desktop WebView. */
export function isTauri(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)
  );
}

/** True when running inside the Capacitor native shell (iOS or Android). */
export function isCapacitor(): boolean {
  return Capacitor.isNativePlatform();
}

/** Any native container (desktop or mobile) rather than a plain browser. */
export function isNative(): boolean {
  return isTauri() || isCapacitor();
}

export function isDesktop(): boolean {
  return isTauri();
}

/** Coarse platform identifier for UI and analytics-free branching. */
export function getPlatform(): Platform {
  if (isTauri()) return 'desktop';
  const p = Capacitor.getPlatform();
  if (p === 'ios' || p === 'android') return p;
  return 'web';
}
