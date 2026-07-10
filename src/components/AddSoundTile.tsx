import { useStore } from '../store/useStore';
import { ACCEPT_ATTR } from '../utils/audioFiles';

/** Dashed drop/pick tile that imports audio files onto the board. */
export function AddSoundTile() {
  const importFiles = useStore((s) => s.importFiles);
  return (
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
  );
}
