import { useStore } from '../store/useStore';
import { SoundButton } from './SoundButton';
import { ACCEPT_ATTR } from '../utils/audioFiles';
import type { GridSize } from '../types';

const COLS: Record<GridSize, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  5: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5',
  6: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6',
};

export function SoundGrid() {
  const visible = useStore((s) => s.visibleSounds());
  const gridSize = useStore((s) => s.settings.gridSize);
  const importFiles = useStore((s) => s.importFiles);

  if (visible.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center text-muted">
        <div className="text-6xl">🎛️</div>
        <p className="text-lg font-semibold text-ink">No sounds here yet</p>
        <p className="max-w-xs text-sm">
          Import audio files, drop them anywhere, or record from your mic to fill
          up the board.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid gap-3 sm:gap-4 ${COLS[gridSize]}`}>
      {visible.map((sound) => (
        <SoundButton key={sound.id} sound={sound} />
      ))}
      <label
        className="glass flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl2 border-2 border-dashed border-line text-muted transition-colors hover:border-accent hover:text-accent"
        aria-label="Add sound"
      >
        <span className="text-4xl">＋</span>
        <span className="text-xs font-semibold">Add sound</span>
        <input
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void importFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </label>
    </div>
  );
}
