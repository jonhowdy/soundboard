import { useState } from 'react';
import { useStore } from '../store/useStore';
import { PACKS } from '../data/packs';
import { Modal } from './ui';

/**
 * Sound-pack catalog. Each card installs a curated, versioned bundle of sounds
 * (rendered offline from the synth palette) into the library with one tap.
 */
export function PackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const installed = useStore((s) => s.installedPacks);
  const installPack = useStore((s) => s.installPack);
  const uninstallPack = useStore((s) => s.uninstallPack);
  const playSound = useStore((s) => s.playSound);
  const sounds = useStore((s) => s.sounds);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>, id: string) => {
    setBusy(id);
    await fn();
    setBusy(null);
  };

  const previewFirst = (packId: string) => {
    const first = sounds.find((s) => s.packId === packId);
    if (first) playSound(first.id);
  };

  return (
    <Modal open={open} onClose={onClose} title="Sound packs" wide>
      <div className="grid gap-3 sm:grid-cols-2">
        {PACKS.map((pack) => {
          const isInstalled = installed.includes(pack.id);
          const isBusy = busy === pack.id;
          return (
            <div
              key={pack.id}
              className="flex flex-col gap-3 rounded-xl2 border border-line/60 bg-elevated/40 p-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl"
                  style={{ backgroundImage: `linear-gradient(150deg, ${pack.color}, #00000055)` }}
                >
                  {pack.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-bold">{pack.name}</h3>
                    <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] text-muted">
                      v{pack.version}
                    </span>
                  </div>
                  <p className="text-xs text-muted">{pack.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {pack.sounds.map((s) => (
                  <span key={s.title} className="chip bg-surface !py-1 text-xs">
                    {s.emoji} {s.title}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-muted">{pack.sounds.length} sounds</span>
                <div className="flex gap-2">
                  {isInstalled && (
                    <>
                      <button
                        onClick={() => previewFirst(pack.id)}
                        className="btn-ghost border border-line !px-2.5 !py-1.5 text-xs"
                      >
                        ▶ Preview
                      </button>
                      <button
                        onClick={() => run(() => uninstallPack(pack.id), pack.id)}
                        disabled={isBusy}
                        className="btn-ghost !px-2.5 !py-1.5 text-xs disabled:opacity-50"
                      >
                        {isBusy ? '…' : 'Remove'}
                      </button>
                    </>
                  )}
                  {isInstalled ? (
                    <span className="chip bg-green-500/15 text-xs font-semibold text-green-400">
                      ✓ Installed
                    </span>
                  ) : (
                    <button
                      onClick={() => run(() => installPack(pack.id), pack.id)}
                      disabled={isBusy}
                      className="btn-accent !px-3 !py-1.5 text-xs disabled:opacity-60"
                    >
                      {isBusy ? 'Installing…' : '⬇ Install'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-muted">
        Packs install offline — audio is generated on-device, nothing is
        downloaded. Removing a pack deletes only its sounds.
      </p>
    </Modal>
  );
}
