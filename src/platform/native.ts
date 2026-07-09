import { isCapacitor, getPlatform } from './index';
import type { ThemeId } from '../types';

/** Light-text themes want a "dark" status-bar style; light themes want "light". */
const LIGHT_THEMES: ThemeId[] = ['light', 'minimal'];

/**
 * One-time native setup for the Capacitor shell: status-bar styling and the
 * Android hardware back button (close modals / stop sounds before exiting).
 * A no-op on web and desktop. Dynamically imports plugins so they never load in
 * the browser bundle's critical path.
 */
export async function initNative(
  theme: ThemeId,
  onBack: () => boolean, // returns true if it handled the event (don't exit)
): Promise<void> {
  if (!isCapacitor()) return;

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({
      style: LIGHT_THEMES.includes(theme) ? Style.Light : Style.Dark,
    });
    if (getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#00000000' });
    }
  } catch {
    /* status bar unavailable */
  }

  try {
    const { App } = await import('@capacitor/app');
    await App.addListener('backButton', ({ canGoBack }) => {
      const handled = onBack();
      if (!handled && !canGoBack) void App.exitApp();
    });
  } catch {
    /* app plugin unavailable */
  }
}

/** Update the status-bar style when the theme changes (native only). */
export async function syncStatusBar(theme: ThemeId): Promise<void> {
  if (!isCapacitor()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({
      style: LIGHT_THEMES.includes(theme) ? Style.Light : Style.Dark,
    });
  } catch {
    /* ignore */
  }
}
