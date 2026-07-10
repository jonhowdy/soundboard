import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { audioEngine } from '../audio/AudioEngine';
import { applyFades, normalize as normalizePcm, peakOf, trim, type Pcm } from '../audio/edit';
import { Modal, Slider, Toggle, formatTime } from './ui';

/** Downsample one channel to N peaks (0..1) for the editor's high-res preview. */
function peaksFrom(pcm: Pcm, buckets = 160): number[] {
  const ch = pcm.channels[0];
  if (!ch || ch.length === 0) return [];
  const block = Math.floor(ch.length / buckets) || 1;
  const peaks: number[] = [];
  let max = 0.0001;
  for (let i = 0; i < buckets; i++) {
    let p = 0;
    for (let j = 0; j < block; j++) {
      const v = Math.abs(ch[i * block + j] ?? 0);
      if (v > p) p = v;
    }
    peaks.push(p);
    if (p > max) max = p;
  }
  return peaks.map((p) => Math.min(1, p / max));
}

type Handle = 'start' | 'end' | null;

export function WaveformEditor({ soundId, onClose }: { soundId: string; onClose: () => void }) {
  const sound = useStore((s) => s.sounds.find((x) => x.id === soundId));
  const ensureLoaded = useStore((s) => s.ensureSoundLoaded);
  const applyEdit = useStore((s) => s.applyAudioEdit);

  const [pcm, setPcm] = useState<Pcm | null>(null);
  const [start, setStart] = useState(0); // fractions 0..1
  const [end, setEnd] = useState(1);
  const [doNormalize, setDoNormalize] = useState(false);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [busy, setBusy] = useState(false);
  const dragRef = useRef<Handle>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await ensureLoaded(soundId);
      const p = audioEngine.getPcm(soundId);
      if (alive) setPcm(p);
    })();
    return () => {
      alive = false;
    };
  }, [soundId, ensureLoaded]);

  const peaks = useMemo(() => (pcm ? peaksFrom(pcm) : []), [pcm]);
  const duration = pcm ? (pcm.channels[0]?.length ?? 0) / pcm.sampleRate : 0;
  const selDuration = duration * (end - start);

  // Pointer dragging of the two region handles.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragRef.current || !barRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const f = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (dragRef.current === 'start') setStart(Math.min(f, end - 0.01));
      else setEnd(Math.max(f, start + 0.01));
    };
    const up = () => (dragRef.current = null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [start, end]);

  const buildEdited = (): Pcm | null => {
    if (!pcm) return null;
    let out = trim(pcm, start * duration, end * duration);
    if (doNormalize) out = normalizePcm(out);
    if (fadeIn > 0 || fadeOut > 0) out = applyFades(out, fadeIn, fadeOut);
    return out;
  };

  const preview = () => audioEngine.previewRegion(soundId, start * duration, end * duration);

  const apply = async () => {
    const edited = buildEdited();
    if (!edited) return;
    setBusy(true);
    await applyEdit(soundId, edited);
    setBusy(false);
    onClose();
  };

  if (!sound) return null;

  return (
    <Modal open onClose={onClose} title="Trim & edit audio" wide>
      {!pcm ? (
        <div className="py-10 text-center text-muted">Decoding audio…</div>
      ) : (
        <div className="space-y-5">
          {/* Waveform with draggable region */}
          <div
            ref={barRef}
            className="relative h-28 w-full select-none overflow-hidden rounded-xl2 bg-elevated"
          >
            <div className="flex h-full items-center gap-px px-1">
              {peaks.map((p, i) => {
                const frac = i / peaks.length;
                const inSel = frac >= start && frac <= end;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-full"
                    style={{
                      height: `${Math.max(3, p * 100)}%`,
                      backgroundColor: inSel ? sound.color : 'rgb(var(--sb-muted))',
                      opacity: inSel ? 1 : 0.35,
                    }}
                  />
                );
              })}
            </div>
            {/* Dim outside selection */}
            <div className="absolute inset-y-0 left-0 bg-black/50" style={{ width: `${start * 100}%` }} />
            <div className="absolute inset-y-0 right-0 bg-black/50" style={{ width: `${(1 - end) * 100}%` }} />
            {/* Handles */}
            <Handle pos={start} color={sound.color} onDown={() => (dragRef.current = 'start')} />
            <Handle pos={end} color={sound.color} onDown={() => (dragRef.current = 'end')} />
          </div>

          <div className="flex items-center justify-between text-sm text-muted">
            <span>Start {formatTime(start * duration)}</span>
            <span className="font-semibold text-ink">Selection {formatTime(selDuration)}</span>
            <span>End {formatTime(end * duration)}</span>
          </div>

          {/* Fine sliders (accessible fallback to dragging) */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Slider label="Trim start" min={0} max={1} step={0.001} value={start}
              onChange={(v) => setStart(Math.min(v, end - 0.01))}
              format={(v) => formatTime(v * duration)} />
            <Slider label="Trim end" min={0} max={1} step={0.001} value={end}
              onChange={(v) => setEnd(Math.max(v, start + 0.01))}
              format={(v) => formatTime(v * duration)} />
            <Slider label="Fade in" min={0} max={Math.min(5, selDuration)} step={0.1} value={fadeIn}
              onChange={setFadeIn} format={(v) => `${v.toFixed(1)}s`} />
            <Slider label="Fade out" min={0} max={Math.min(5, selDuration)} step={0.1} value={fadeOut}
              onChange={setFadeOut} format={(v) => `${v.toFixed(1)}s`} />
          </div>

          <div className="flex items-center justify-between rounded-xl2 border border-line/60 bg-elevated/40 p-3">
            <Toggle
              label={`Normalize volume (peak ${(peakOf(pcm) * 100).toFixed(0)}% → 99%)`}
              checked={doNormalize}
              onChange={setDoNormalize}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <button onClick={preview} className="btn-ghost border border-line">▶ Preview selection</button>
              <button
                onClick={() => {
                  setStart(0); setEnd(1); setFadeIn(0); setFadeOut(0); setDoNormalize(false);
                }}
                className="btn-ghost"
              >
                Reset
              </button>
            </div>
            <button onClick={apply} disabled={busy} className="btn-accent px-5 disabled:opacity-60">
              {busy ? 'Applying…' : '✓ Apply edit'}
            </button>
          </div>
          <p className="text-center text-xs text-muted">
            Applying overwrites this sound's audio (re-encoded to WAV). Export a
            backup first if you want to keep the original.
          </p>
        </div>
      )}
    </Modal>
  );
}

function Handle({ pos, color, onDown }: { pos: number; color: string; onDown: () => void }) {
  return (
    <div
      onPointerDown={(e) => {
        e.preventDefault();
        onDown();
      }}
      className="absolute inset-y-0 z-10 flex w-3 cursor-ew-resize items-center justify-center"
      style={{ left: `calc(${pos * 100}% - 6px)` }}
      role="slider"
      aria-label="Region handle"
      aria-valuenow={Math.round(pos * 100)}
    >
      <div className="h-full w-1 rounded-full" style={{ backgroundColor: color }} />
      <div className="absolute h-5 w-5 rounded-full border-2 border-white shadow" style={{ backgroundColor: color }} />
    </div>
  );
}
