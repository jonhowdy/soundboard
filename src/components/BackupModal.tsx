import { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { Modal } from './ui';
import type { BackupFile } from '../types';

/** Trigger a browser download of a Blob. */
function download(data: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const stamp = () => new Date().toISOString().slice(0, 10);

export function BackupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const backups = useStore((s) => s.backups);
  const exportBackup = useStore((s) => s.exportBackup);
  const importBackup = useStore((s) => s.importBackup);
  const exportCsv = useStore((s) => s.exportCsv);
  const exportZipBytes = useStore((s) => s.exportZipBytes);
  const importZip = useStore((s) => s.importZip);
  const createBackupSnapshot = useStore((s) => s.createBackupSnapshot);
  const restoreBackup = useStore((s) => s.restoreBackup);
  const removeBackup = useStore((s) => s.removeBackup);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const doJson = async () => {
    const backup = await exportBackup();
    download(JSON.stringify(backup, null, 2), `soundboard-${stamp()}.json`, 'application/json');
  };
  const doZip = async () => {
    setBusy(true);
    const bytes = await exportZipBytes();
    download(bytes as unknown as BlobPart, `soundboard-${stamp()}.zip`, 'application/zip');
    setBusy(false);
  };
  const doCsv = () =>
    download(exportCsv(), `soundboard-${stamp()}.csv`, 'text/csv');

  const onImportFile = async (file: File) => {
    setBusy(true);
    try {
      if (file.name.toLowerCase().endsWith('.zip')) {
        await importZip(new Uint8Array(await file.arrayBuffer()));
      } else {
        const backup = JSON.parse(await file.text()) as BackupFile;
        if (backup.version !== 1) throw new Error('Unsupported backup version');
        await importBackup(backup);
      }
      alert('Import complete.');
    } catch (e) {
      alert(`Import failed: ${e instanceof Error ? e.message : 'invalid file'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Backup & restore" wide>
      <div className="space-y-5">
        <section>
          <h3 className="mb-2 text-sm font-bold text-muted">Export</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button onClick={doZip} disabled={busy} className="btn-accent disabled:opacity-60">
              📦 ZIP (with audio)
            </button>
            <button onClick={doJson} className="btn-ghost border border-line">
              🗂 JSON backup
            </button>
            <button onClick={doCsv} className="btn-ghost border border-line">
              📄 CSV list
            </button>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-bold text-muted">Import</h3>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="btn-ghost w-full border border-line disabled:opacity-60"
          >
            ⬆ Import from JSON or ZIP
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.zip,application/json,application/zip"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImportFile(f);
              e.target.value = '';
            }}
          />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-muted">
              Version history <span className="text-ink">({backups.length})</span>
            </h3>
            <button
              onClick={() => void createBackupSnapshot(false, 'Manual')}
              className="btn-accent !px-3 !py-1.5 text-xs"
            >
              ＋ Back up now
            </button>
          </div>

          {backups.length === 0 ? (
            <p className="rounded-xl2 bg-elevated/50 p-5 text-center text-sm text-muted">
              No saved versions yet. An automatic backup is taken daily, or make
              one now — restore any version with a tap.
            </p>
          ) : (
            <ul className="max-h-64 space-y-1.5 overflow-y-auto">
              {[...backups]
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center gap-3 rounded-xl bg-elevated/60 px-3 py-2 text-sm"
                  >
                    <span className="text-lg">{b.auto ? '🕑' : '📌'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {new Date(b.createdAt).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted">
                        {b.auto ? 'Automatic' : b.label ?? 'Manual'} · {b.sounds} sounds ·{' '}
                        {b.categories} categories
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Restore this version? Current sounds with the same id are overwritten.'))
                          void restoreBackup(b.id);
                      }}
                      className="btn-ghost border border-line !px-2.5 !py-1 text-xs"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => void removeBackup(b.id)}
                      aria-label="Delete backup"
                      className="btn-ghost !px-2 !py-1 text-xs"
                    >
                      🗑
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <p className="text-center text-xs text-muted">
          Everything stays on your device. ZIP includes your audio; JSON is a full
          restorable backup; CSV is a metadata list for spreadsheets.
        </p>
      </div>
    </Modal>
  );
}
