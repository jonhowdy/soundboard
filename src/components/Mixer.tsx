import { useState } from 'react';
import { useStore } from '../store/useStore';

/** Floating mixer showing every live voice with individual volume + stop. */
export function Mixer() {
  const voices = useStore((s) => s.activeVoices);
  const stopSound = useStore((s) => s.stopSound);
  const stopAll = useStore((s) => s.stopAll);
  const setVoiceVolume = useStore((s) => s.setVoiceVolume);
  const master = useStore((s) => s.settings.masterVolume);
  const updateSettings = useStore((s) => s.updateSettings);
  const [collapsed, setCollapsed] = useState(false);

  if (voices.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="glass pointer-events-auto w-full max-w-lg rounded-xl2 p-3 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
            </span>
            {voices.length} playing
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted">
              🔊
              <input
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={master}
                onChange={(e) => updateSettings({ masterVolume: Number(e.target.value) })}
                className="w-24 accent-accent"
                aria-label="Master volume"
              />
            </label>
            <button onClick={stopAll} className="btn-ghost !px-2 !py-1 text-xs">
              Stop all
            </button>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="btn-ghost !px-2 !py-1 text-xs"
              aria-label={collapsed ? 'Expand mixer' : 'Collapse mixer'}
            >
              {collapsed ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {!collapsed && (
          <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
            {voices.map((v) => (
              <li key={v.id} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{v.title}</span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.01}
                  defaultValue={1}
                  onChange={(e) => setVoiceVolume(v.id, Number(e.target.value))}
                  className="w-24 accent-accent"
                  aria-label={`Volume for ${v.title}`}
                />
                <button
                  onClick={() => stopSound(v.soundId)}
                  className="btn-ghost !px-2 !py-0.5 text-xs"
                  aria-label={`Stop ${v.title}`}
                >
                  ⏹
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
