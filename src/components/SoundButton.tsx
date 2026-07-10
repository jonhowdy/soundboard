import { useRef, useState } from 'react';
import clsx from 'clsx';
import type { Sound } from '../types';
import { useStore } from '../store/useStore';
import { Waveform } from './Waveform';
import { formatTime } from './ui';

/** Derive a pleasing gradient + readable text color from the button's base color. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
function readableText(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1a1a1a' : '#ffffff';
}

export function SoundButton({ sound }: { sound: Sound }) {
  const playSound = useStore((s) => s.playSound);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const setEditingSound = useStore((s) => s.setEditingSound);
  const showWaveforms = useStore((s) => s.settings.showWaveforms);
  const confetti = useStore((s) => s.settings.confetti);
  const playing = useStore((s) => s.activeVoices.some((v) => v.soundId === sound.id));

  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleId = useRef(0);
  const [burst, setBurst] = useState(false);
  const fg = readableText(sound.color);

  const trigger = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const id = rippleId.current++;
    setRipples((r) => [
      ...r,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 600);
    if (confetti) {
      setBurst(true);
      setTimeout(() => setBurst(false), 700);
    }
    playSound(sound.id);
  };

  return (
    <button
      onClick={trigger}
      onContextMenu={(e) => {
        e.preventDefault();
        setEditingSound(sound.id);
      }}
      aria-label={`Play ${sound.title}`}
      title={`${sound.title}${sound.hotkey ? ` (${sound.hotkey})` : ''} — right-click to edit`}
      className={clsx(
        'group relative flex aspect-square flex-col overflow-hidden rounded-xl2 p-3 text-left',
        'shadow-lg ring-1 ring-white/10 transition-transform duration-150',
        'hover:-translate-y-0.5 hover:shadow-xl active:animate-pop',
        playing && 'animate-pulseglow',
      )}
      style={{
        backgroundImage: `linear-gradient(150deg, ${sound.color}, ${sound.color}bb 55%, #00000055)`,
        color: fg,
      }}
    >
      {/* Ripples */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 animate-ripple rounded-full bg-white/40"
          style={{ left: r.x, top: r.y }}
        />
      ))}
      {burst && <ConfettiBurst />}

      {/* Top row: icon + favorite */}
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/20 text-2xl backdrop-blur-sm">
          {sound.image ? (
            <img
              src={sound.image}
              alt=""
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            <span>{sound.emoji ?? '🔊'}</span>
          )}
        </div>
        <span
          role="button"
          tabIndex={0}
          aria-label={sound.favorite ? 'Unfavorite' : 'Favorite'}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(sound.id);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(sound.id);
            }
          }}
          className={clsx(
            'cursor-pointer text-lg transition-transform hover:scale-125',
            sound.favorite ? 'opacity-100' : 'opacity-40 group-hover:opacity-70',
          )}
        >
          {sound.favorite ? '★' : '☆'}
        </span>
      </div>

      {/* Title block */}
      <div className="mt-auto min-w-0">
        <div className="truncate text-sm font-bold leading-tight sm:text-base">
          {sound.title}
        </div>
        {sound.subtitle && (
          <div className="truncate text-[11px] opacity-80">{sound.subtitle}</div>
        )}
      </div>

      {/* Waveform + meta */}
      {showWaveforms && (
        <div className="mt-1.5 h-4 opacity-80">
          <Waveform peaks={sound.waveform} className="h-full w-full" animated={playing} />
        </div>
      )}
      <div className="mt-1 flex items-center justify-between text-[10px] font-medium opacity-70">
        <span>{formatTime(sound.duration)}</span>
        {sound.hotkey && (
          <kbd className="rounded bg-black/25 px-1.5 py-0.5 font-mono">
            {sound.hotkey}
          </kbd>
        )}
      </div>
    </button>
  );
}

function ConfettiBurst() {
  const bits = Array.from({ length: 14 });
  const colors = ['#fde047', '#f472b6', '#4ade80', '#38bdf8', '#c084fc'];
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden">
      {bits.map((_, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-sm"
          style={{
            background: colors[i % colors.length],
            transform: `rotate(${(360 / bits.length) * i}deg) translateY(-40px)`,
            animation: 'ripple 700ms ease-out forwards',
          }}
        />
      ))}
    </span>
  );
}
