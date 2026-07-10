import { isCapacitor, getPlatform } from './index';

/**
 * One-time native setup for the Capacitor shell: status-bar styling and the
 * Android hardware back button (close modals / stop sounds before exiting).
 * A no-op on web and desktop. Dynamically imports plugins so they never load in
 * the browser bundle's critical path. `light` reflects the active theme's
 * background so the status-bar text stays legible (works for custom themes too).
 */
export async function initNative(
  light: boolean,
  onBack: () => boolean, // returns true if it handled the event (don't exit)
): Promise<void> {
  if (!isCapacitor()) return;

  await syncStatusBar(light);
  if (getPlatform() === 'android') {
    try {
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.setBackgroundColor({ color: '#00000000' });
    } catch {
      /* ignore */
    }
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

/** Update the status-bar style for the active theme (native only). */
export async function syncStatusBar(light: boolean): Promise<void> {
  if (!isCapacitor()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: light ? Style.Light : Style.Dark });
  } catch {
    /* status bar unavailable */
  }
}
