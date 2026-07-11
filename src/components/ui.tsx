import { useEffect, useRef, type ReactNode } from 'react';
import clsx from 'clsx';

/**
 * Stack of currently-open modals (outermost first). Escape must close only the
 * topmost modal — without this, nested modals (e.g. the trim editor inside the
 * sound editor) would all close on a single keypress.
 */
const modalStack: symbol[] = [];

/** True while any modal is open (used to suppress global Escape = stop-all). */
export function hasOpenModal(): boolean {
  return modalStack.length > 0;
}

/** Accessible modal with backdrop, Escape-to-close and focus containment. */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const tokenRef = useRef<symbol>();
  if (!tokenRef.current) tokenRef.current = Symbol('modal');

  useEffect(() => {
    if (!open) return;
    const token = tokenRef.current!;
    modalStack.push(token);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalStack[modalStack.length - 1] === token) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      const idx = modalStack.indexOf(token);
      if (idx !== -1) modalStack.splice(idx, 1);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={clsx(
          'glass relative z-10 w-full rounded-xl2 shadow-2xl',
          'max-h-[90vh] overflow-y-auto',
          wide ? 'max-w-3xl' : 'max-w-md',
        )}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line/60 bg-panel/80 px-5 py-3.5 backdrop-blur-xl">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="btn-ghost !px-2 !py-1" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/** Labeled range slider with a live value read-out. */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-ink">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 py-1.5 text-left"
    >
      <span className="text-sm text-ink">{label}</span>
      <span
        className={clsx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-line',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  );
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
