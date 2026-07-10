import { useCallback, useRef, useState } from 'react';

export interface RecorderApi {
  recording: boolean;
  elapsed: number;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
  cancel: () => void;
}

/**
 * Thin wrapper over MediaRecorder for capturing mic / USB / Bluetooth input.
 * The chosen input device is whatever the browser/OS routes as the default;
 * device selection can be layered on via `navigator.mediaDevices.enumerateDevices`.
 */
export function useRecorder(): RecorderApi {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRef.current = null;
    setRecording(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start();
      mediaRef.current = rec;
      setElapsed(0);
      setRecording(true);
      const started = Date.now();
      timerRef.current = window.setInterval(
        () => setElapsed((Date.now() - started) / 1000),
        100,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone unavailable');
      cleanup();
    }
  }, [cleanup]);

  const stop = useCallback(async (): Promise<Blob | null> => {
    const rec = mediaRef.current;
    if (!rec) return null;
    return new Promise((resolve) => {
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || 'audio/webm',
        });
        cleanup();
        resolve(blob);
      };
      rec.stop();
    });
  }, [cleanup]);

  const cancel = useCallback(() => {
    try {
      mediaRef.current?.stop();
    } catch {
      /* ignore */
    }
    cleanup();
  }, [cleanup]);

  return { recording, elapsed, error, start, stop, cancel };
}
