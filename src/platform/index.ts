/**
 * Platform detection. The same bundle runs as a web PWA and inside the Tauri
 * desktop shell; this module lets feature code branch without importing any
 * Tauri APIs on the web path.
 */

/** True when running inside the Tauri desktop WebView. */
export function isTauri(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)
  );
}

export function isDesktop(): boolean {
  return isTauri();
}
