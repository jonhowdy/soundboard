import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isCapacitor } from './index';

/**
 * Fire a light haptic tap on play. On native iOS/Android this maps to the
 * platform's Taptic/vibration engine via Capacitor; in the browser it falls
 * back to the Vibration API where available. Best-effort and non-blocking —
 * haptics must never delay or fail a sound trigger.
 */
export function hapticTap(): void {
  try {
    if (isCapacitor()) {
      void Haptics.impact({ style: ImpactStyle.Light });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  } catch {
    /* haptics are cosmetic; ignore any failure */
  }
}
