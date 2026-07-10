import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useStore } from '../store/useStore';
import { Modal } from './ui';

/**
 * Queue manager: build an ordered list of sounds, reorder/remove them, then
 * auto-play the whole queue in sequence. Adding is done from an in-modal picker
 * so it works on touch without leaving the sheet.
 */
export function QueueModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queue = useStore((s) => s.queue);
  const sounds = useStore((s) => s.sounds);
  const queuePlaying = useStore((s) => s.queuePlaying);
  const queueIndex = useStore((s) => s.queueIndex);
  const addToQueue = useStore((s) => s.addToQueue);
  const removeFromQueue = useStore((s) => s.removeFromQueue);
  const moveInQueue = useStore((s) => s.moveInQueue);
  const clearQueue = useStore((s) => s.clearQueue);
  const playQueue = useStore((s) => s.playQueue);
  const stopQueue = useStore((s) => s.stopQueue);

  const [filter, setFilter] = useState('');
  const byId = useMemo(() => new Map(sounds.map((s) => [s.id, s])), [sounds]);
  const pickable = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return sounds.filter((s) => !q || s.title.toLowerCase().includes(q));
  }, [sounds, filter]);

  return (
    <Modal open={open} onClose={onClose} title="Queue" wide>
      <div className="grid gap-5 md:grid-cols-2">
        {/* Current queue */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-muted">
              In queue <span className="text-ink">({queue.length})</span>
            </h3>
            <div className="flex gap-2">
              {queuePlaying ? (
                <button onClick={stopQueue} className="btn bg-red-500 px-3 py-1.5 text-xs text-white">
                  ⏹ Stop
                </button>
              ) : (
                <button
                  onClick={playQueue}
                  disabled={queue.length === 0}
                  className="btn-accent px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  ▶ Play all
                </button>
              )}
              <button
                onClick={clearQueue}
                disabled={queue.length === 0}
                className="btn-ghost border border-line px-3 py-1.5 text-xs disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>

          {queue.length === 0 ? (
            <p className="rounded-xl2 bg-elevated/50 p-6 text-center text-sm text-muted">
              Queue is empty. Add sounds from the right →
            </p>
          ) : (
            <ul className="space-y-1.5">
              {queue.map((id, i) => {
                const sound = byId.get(id);
                const active = queuePlaying && i === queueIndex;
                return (
                  <li
                    key={`${id}-${i}`}
                    className={clsx(
                      'flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm',
                      active ? 'bg-accent/20 ring-1 ring-accent' : 'bg-elevated/60',
                    )}
                  >
                    <span className="w-5 text-center text-xs font-bold text-muted">
                      {active ? '▶' : i + 1}
                    </span>
                    <span className="text-lg">{sound?.emoji ?? '🔊'}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {sound?.title ?? 'Missing sound'}
                    </span>
                    <button
                      onClick={() => moveInQueue(i, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                      className="btn-ghost !px-1.5 !py-0.5 text-xs disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveInQueue(i, 1)}
                      disabled={i === queue.length - 1}
                      aria-label="Move down"
                      className="btn-ghost !px-1.5 !py-0.5 text-xs disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeFromQueue(i)}
                      aria-label="Remove from queue"
                      className="btn-ghost !px-1.5 !py-0.5 text-xs"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Add sounds */}
        <div>
          <h3 className="mb-2 text-sm font-bold text-muted">Add sounds</h3>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter…"
            className="field mb-2"
            aria-label="Filter sounds to add"
          />
          <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {pickable.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => addToQueue(s.id)}
                  className="flex w-full items-center gap-2 rounded-xl bg-elevated/40 px-2.5 py-2 text-left text-sm transition-colors hover:bg-elevated"
                >
                  <span className="text-lg">{s.emoji ?? '🔊'}</span>
                  <span className="min-w-0 flex-1 truncate">{s.title}</span>
                  <span className="text-accent">＋</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
