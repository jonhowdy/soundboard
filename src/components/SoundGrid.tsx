import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store/useStore';
import { SoundButton } from './SoundButton';
import { AddSoundTile } from './AddSoundTile';
import { chunk } from '../utils/array';
import type { GridSize } from '../types';

const COLS: Record<GridSize, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  5: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5',
  6: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6',
};

export function SoundGrid() {
  // visibleSounds() builds a fresh array per call; shallow-compare its items so
  // unrelated store churn (e.g. live mixer voices) doesn't re-render the grid.
  const visible = useStore(useShallow((s) => s.visibleSounds()));
  const gridSize = useStore((s) => s.settings.gridSize);
  // Filter/sort inputs form a signature; when they change we jump back to page 1.
  const search = useStore((s) => s.search);
  const activeCategory = useStore((s) => s.activeCategory);
  const favoritesOnly = useStore((s) => s.favoritesOnly);
  const sort = useStore((s) => s.sort);

  const [page, setPage] = useState(0);
  const startX = useRef<number | null>(null);

  // A full screen holds gridSize × gridSize buttons; the rest spill onto pages.
  const perPage = gridSize * gridSize;
  const pages = chunk(visible, perPage);
  const pageCount = Math.max(1, pages.length);

  // Reset to the first page whenever the filtered set changes.
  useEffect(() => {
    setPage(0);
  }, [search, activeCategory, favoritesOnly, sort, gridSize]);

  // Clamp if deletions shrank the page count below the current page.
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  if (visible.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center text-muted">
        <div className="text-6xl">🎛️</div>
        <p className="text-lg font-semibold text-ink">No sounds here yet</p>
        <p className="max-w-xs text-sm">
          Import audio files, drop them anywhere, or record from your mic to fill
          up the board.
        </p>
        <div className={`grid w-full max-w-xs gap-3 ${COLS[gridSize]}`}>
          <AddSoundTile />
        </div>
      </div>
    );
  }

  const current = Math.min(page, pageCount - 1);
  const pageSounds = pages[current] ?? [];
  const isLastPage = current === pageCount - 1;

  const go = (dir: -1 | 1) =>
    setPage((p) => Math.max(0, Math.min(pageCount - 1, p + dir)));

  return (
    <div>
      <div
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); // swipe left → next
        }}
        className={`grid touch-pan-y gap-3 sm:gap-4 ${COLS[gridSize]}`}
      >
        {pageSounds.map((sound) => (
          <SoundButton key={sound.id} sound={sound} />
        ))}
        {/* The add tile lives on the last page. */}
        {isLastPage && <AddSoundTile />}
      </div>

      {pageCount > 1 && (
        <nav
          className="mt-5 flex items-center justify-center gap-3"
          aria-label="Board pages"
        >
          <button
            onClick={() => go(-1)}
            disabled={current === 0}
            className="btn-ghost !px-2.5 disabled:opacity-30"
            aria-label="Previous page"
          >
            ‹
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}`}
                aria-current={i === current}
                className={clsx(
                  'h-2.5 rounded-full transition-all',
                  i === current ? 'w-6 bg-accent' : 'w-2.5 bg-line hover:bg-muted',
                )}
              />
            ))}
          </div>
          <button
            onClick={() => go(1)}
            disabled={current === pageCount - 1}
            className="btn-ghost !px-2.5 disabled:opacity-30"
            aria-label="Next page"
          >
            ›
          </button>
          <span className="ml-1 text-xs text-muted">
            {current + 1}/{pageCount}
          </span>
        </nav>
      )}
    </div>
  );
}
