import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useRecorder } from '../hooks/useRecorder';
import { Modal, formatTime } from './ui';

export function RecordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rec = useRecorder();
  const addRecording = useStore((s) => s.addRecording);
  const [title, setTitle] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  const reset = () => {
    setTitle('');
    setPreview((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
    setBlob(null);
  };

  const handleStop = async () => {
    const b = await rec.stop();
    if (b) {
      setBlob(b);
      setPreview((url) => {
        if (url) URL.revokeObjectURL(url);
        return URL.createObjectURL(b);
      });
    }
  };

  const save = async () => {
    if (!blob) return;
    await addRecording(blob, title.trim() || 'Recording');
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        rec.cancel();
        reset();
        onClose();
      }}
      title="Record a sound"
    >
      <div className="flex flex-col items-center gap-5 py-2">
        <div
          className={
            'grid h-28 w-28 place-items-center rounded-full text-5xl transition-all ' +
            (rec.recording
              ? 'animate-pulseglow bg-red-500/20 text-red-400'
              : 'bg-elevated text-muted')
          }
        >
          🎙️
        </div>

        <div className="font-mono text-2xl tabular-nums">
          {formatTime(rec.elapsed)}
        </div>

        {rec.error && <p className="text-sm text-red-400">{rec.error}</p>}

        {!rec.recording && !blob && (
          <button onClick={rec.start} className="btn-accent px-6 py-2.5">
            ● Start recording
          </button>
        )}
        {rec.recording && (
          <button
            onClick={handleStop}
            className="btn bg-red-500 px-6 py-2.5 text-white"
          >
            ■ Stop
          </button>
        )}

        {preview && (
          <div className="w-full space-y-3">
            <audio src={preview} controls className="w-full" />
            <input
              autoFocus
              className="field"
              placeholder="Name your recording"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={reset} className="btn-ghost">
                Re-record
              </button>
              <button onClick={save} className="btn-accent">
                Save to board
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-muted">
        Uses your default input (mic, USB or Bluetooth). Trim &amp; tweak it in the
        editor after saving.
      </p>
    </Modal>
  );
}
