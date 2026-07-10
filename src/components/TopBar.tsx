import clsx from 'clsx';
import { useStore, type SortKey } from '../store/useStore';
import type { GridSize } from '../types';

const GRID_SIZES: GridSize[] = [2, 3, 4, 5, 6];
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'name', label: 'A–Z' },
  { key: 'played', label: 'Most played' },
  { key: 'created', label: 'Newest' },
];

export function TopBar({
  onOpenRecord,
  onOpenSettings,
  onOpenStats,
  onOpenQueue,
  onOpenPacks,
}: {
  onOpenRecord: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onOpenQueue: () => void;
  onOpenPacks: () => void;
}) {
  const search = useStore((s) => s.search);
  const setSearch = useStore((s) => s.setSearch);
  const favoritesOnly = useStore((s) => s.favoritesOnly);
  const setFavoritesOnly = useStore((s) => s.setFavoritesOnly);
  const sort = useStore((s) => s.sort);
  const setSort = useStore((s) => s.setSort);
  const gridSize = useStore((s) => s.settings.gridSize);
  const updateSettings = useStore((s) => s.updateSettings);
  const playRandom = useStore((s) => s.playRandom);
  const stopAll = useStore((s) => s.stopAll);
  const queueCount = useStore((s) => s.queue.length);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 pr-1">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent2 text-lg shadow-glow">
            🎚️
          </div>
          <span className="hidden text-lg font-black tracking-tight sm:block">
            Soundboard
          </span>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, tag, category…"
            className="field !pl-9"
            aria-label="Search sounds"
          />
        </div>

        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          aria-pressed={favoritesOnly}
          title="Favorites only"
          className={clsx('btn-ghost !px-2.5', favoritesOnly && 'text-amber-400')}
        >
          {favoritesOnly ? '★' : '☆'}
        </button>

        <button onClick={() => playRandom('library')} className="btn-accent" title="Play random">
          🎲 <span className="hidden md:inline">Random</span>
        </button>
        <button onClick={stopAll} className="btn-ghost" title="Stop all (Esc)">
          ⏹ <span className="hidden md:inline">Stop</span>
        </button>
        <button onClick={onOpenQueue} className="btn-ghost relative" title="Queue">
          📋
          {queueCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
              {queueCount}
            </span>
          )}
        </button>
        <button onClick={onOpenPacks} className="btn-ghost" title="Sound packs">
          🎁
        </button>
        <button onClick={onOpenRecord} className="btn-ghost" title="Record">
          🎙️
        </button>
        <button onClick={onOpenStats} className="btn-ghost" title="Statistics">
          📊
        </button>
        <button onClick={onOpenSettings} className="btn-ghost" title="Settings">
          ⚙️
        </button>
      </div>

      {/* Secondary controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={clsx(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                sort === s.key
                  ? 'bg-accent text-white'
                  : 'text-muted hover:bg-elevated hover:text-ink',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Grid</span>
          <div className="flex overflow-hidden rounded-lg border border-line">
            {GRID_SIZES.map((g) => (
              <button
                key={g}
                onClick={() => updateSettings({ gridSize: g })}
                className={clsx(
                  'px-2.5 py-1 text-xs font-semibold transition-colors',
                  gridSize === g
                    ? 'bg-accent text-white'
                    : 'text-muted hover:bg-elevated',
                )}
              >
                {g}×{g}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
