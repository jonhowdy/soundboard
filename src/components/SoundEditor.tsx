import { useEffect, useState } from 'react';
import { useStore, PALETTE } from '../store/useStore';
import type { PlayMode, Sound } from '../types';
import { Modal, Slider, Toggle } from './ui';
import { Waveform } from './Waveform';
import { WaveformEditor } from './WaveformEditor';
import { comboFromEvent } from '../hooks/useHotkeys';
import { suggestMeta } from '../utils/suggest';

const PLAY_MODES: { key: PlayMode; label: string }[] = [
  { key: 'oneshot', label: 'One shot' },
  { key: 'loop', label: 'Loop' },
  { key: 'hold', label: 'Hold' },
];

export function SoundEditor() {
  const editingId = useStore((s) => s.editingSoundId);
  const sound = useStore((s) => s.sounds.find((x) => x.id === editingId));
  const categories = useStore((s) => s.categories);
  const close = useStore((s) => s.setEditingSound);
  const update = useStore((s) => s.updateSound);
  const del = useStore((s) => s.deleteSound);
  const duplicate = useStore((s) => s.duplicateSound);
  const play = useStore((s) => s.playSound);

  const [capturing, setCapturing] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [trimOpen, setTrimOpen] = useState(false);

  useEffect(() => {
    setCapturing(false);
    setTrimOpen(false);
  }, [editingId]);

  if (!sound) return null;

  const patch = (p: Partial<Sound>) => update(sound.id, p);
  const patchPlayback = (p: Partial<Sound['playback']>) =>
    patch({ playback: { ...sound.playback, ...p } });

  return (
    <Modal open onClose={() => close(null)} title="Edit sound" wide>
      <div className="grid gap-5 md:grid-cols-2">
        {/* Left: identity */}
        <div className="space-y-4">
          <div
            className="flex items-center gap-3 rounded-xl2 p-4"
            style={{ backgroundImage: `linear-gradient(150deg, ${sound.color}, #00000066)` }}
          >
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-black/25 text-3xl">
              {sound.emoji ?? '🔊'}
            </div>
            <div className="min-w-0 flex-1 text-white">
              <div className="truncate font-bold">{sound.title || 'Untitled'}</div>
              <div className="h-5 opacity-80">
                <Waveform peaks={sound.waveform} className="h-full w-full" />
              </div>
            </div>
            <button
              onClick={() => play(sound.id)}
              className="btn bg-black/30 text-white"
              aria-label="Preview"
            >
              ▶
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const s = suggestMeta(sound.title, sound.tags);
                patch({ emoji: s.emoji, color: s.color, tags: s.tags });
              }}
              className="btn-ghost border border-line"
              title="Auto-suggest emoji, color and tags from the title"
            >
              ✨ Auto-style
            </button>
            <button
              onClick={() => setTrimOpen(true)}
              className="btn-ghost border border-line"
              title="Trim, normalize and fade the audio"
            >
              ✂️ Trim &amp; edit
            </button>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm text-muted">Title</span>
            <input
              className="field"
              value={sound.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-muted">Subtitle</span>
            <input
              className="field"
              value={sound.subtitle ?? ''}
              onChange={(e) => patch({ subtitle: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm text-muted">Emoji</span>
              <input
                className="field text-center text-xl"
                value={sound.emoji ?? ''}
                maxLength={4}
                onChange={(e) => patch({ emoji: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-muted">Category</span>
              <select
                className="field"
                value={sound.categoryId ?? ''}
                onChange={(e) => patch({ categoryId: e.target.value || null })}
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-sm text-muted">Color</span>
            <div className="flex flex-wrap gap-1.5">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => patch({ color: c })}
                  aria-label={`Color ${c}`}
                  aria-pressed={sound.color === c}
                  className={
                    'h-7 w-7 rounded-full transition-transform hover:scale-110 ' +
                    (sound.color === c
                      ? 'ring-2 ring-ink ring-offset-2 ring-offset-panel'
                      : '')
                  }
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <span className="mb-1.5 block text-sm text-muted">Tags</span>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {sound.tags.map((t) => (
                <span key={t} className="chip bg-elevated text-xs">
                  #{t}
                  <button
                    onClick={() => patch({ tags: sound.tags.filter((x) => x !== t) })}
                    aria-label={`Remove ${t}`}
                    className="text-muted hover:text-ink"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <input
              className="field"
              placeholder="Add tag + Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagInput.trim()) {
                  const t = tagInput.trim().toLowerCase();
                  if (!sound.tags.includes(t)) patch({ tags: [...sound.tags, t] });
                  setTagInput('');
                }
              }}
            />
          </div>
        </div>

        {/* Right: behavior + effects */}
        <div className="space-y-4">
          <div>
            <span className="mb-1.5 block text-sm text-muted">Play mode</span>
            <div className="flex overflow-hidden rounded-xl border border-line">
              {PLAY_MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => {
                    patch({ playMode: m.key });
                    patchPlayback({ loop: m.key === 'loop' });
                  }}
                  className={
                    'flex-1 px-3 py-2 text-sm font-semibold transition-colors ' +
                    (sound.playMode === m.key
                      ? 'bg-accent text-white'
                      : 'text-muted hover:bg-elevated')
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hotkey capture */}
          <div>
            <span className="mb-1.5 block text-sm text-muted">Hotkey</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCapturing((c) => !c)}
                onKeyDown={(e) => {
                  if (!capturing) return;
                  e.preventDefault();
                  if (e.key === 'Escape') {
                    setCapturing(false);
                    return;
                  }
                  if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
                  patch({ hotkey: comboFromEvent(e) });
                  setCapturing(false);
                }}
                className={
                  'field flex-1 text-left font-mono ' +
                  (capturing ? 'ring-2 ring-accent' : '')
                }
              >
                {capturing ? 'Press keys…' : sound.hotkey || 'Click to assign'}
              </button>
              {sound.hotkey && (
                <button
                  onClick={() => patch({ hotkey: undefined })}
                  className="btn-ghost"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-xl2 border border-line/60 bg-elevated/40 p-3">
            <p className="text-sm font-semibold">Effects</p>
            <Slider
              label="Volume"
              min={0}
              max={2}
              step={0.01}
              value={sound.playback.volume}
              onChange={(v) => patchPlayback({ volume: v })}
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <Slider
              label="Speed"
              min={0.25}
              max={4}
              step={0.05}
              value={sound.playback.rate}
              onChange={(v) => patchPlayback({ rate: v })}
              format={(v) => `${v.toFixed(2)}×`}
            />
            <Slider
              label="Pitch"
              min={-12}
              max={12}
              step={1}
              value={sound.playback.pitch}
              onChange={(v) => patchPlayback({ pitch: v })}
              format={(v) => `${v > 0 ? '+' : ''}${v} st`}
            />
            <Slider
              label="Fade in"
              min={0}
              max={5}
              step={0.1}
              value={sound.playback.fadeIn}
              onChange={(v) => patchPlayback({ fadeIn: v })}
              format={(v) => `${v.toFixed(1)}s`}
            />
            <Slider
              label="Fade out"
              min={0}
              max={5}
              step={0.1}
              value={sound.playback.fadeOut}
              onChange={(v) => patchPlayback({ fadeOut: v })}
              format={(v) => `${v.toFixed(1)}s`}
            />
            <div className="flex gap-4">
              <Toggle
                label="Reverse"
                checked={sound.playback.reverse}
                onChange={(v) => patchPlayback({ reverse: v })}
              />
              <Toggle
                label="Loop"
                checked={sound.playback.loop}
                onChange={(v) => patchPlayback({ loop: v })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={() => {
                void duplicate(sound.id);
              }}
              className="btn-ghost"
            >
              ⧉ Duplicate
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete "${sound.title}"?`)) {
                  void del(sound.id);
                  close(null);
                }
              }}
              className="btn bg-red-500/90 text-white hover:bg-red-500"
            >
              🗑 Delete
            </button>
          </div>
        </div>
      </div>

      {trimOpen && (
        <WaveformEditor soundId={sound.id} onClose={() => setTrimOpen(false)} />
      )}
    </Modal>
  );
}
