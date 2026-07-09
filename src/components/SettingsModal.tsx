import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { THEMES } from '../themes/themes';
import type { ThemeId } from '../types';
import { Modal, Toggle } from './ui';
import type { BackupFile } from '../types';
import { audioEngine } from '../audio/AudioEngine';
import { isDesktop } from '../platform';

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const exportBackup = useStore((s) => s.exportBackup);
  const importBackup = useStore((s) => s.importBackup);
  const fileRef = useRef<HTMLInputElement>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const routingSupported = audioEngine.supportsOutputRouting();

  const refreshDevices = async () => {
    // Labels only populate after the user has granted mic/audio permission.
    try {
      await navigator.mediaDevices?.getUserMedia({ audio: true }).then((s) =>
        s.getTracks().forEach((t) => t.stop()),
      );
    } catch {
      /* permission optional; unlabeled devices still list */
    }
    setDevices(await audioEngine.listOutputDevices());
  };

  useEffect(() => {
    if (open && routingSupported) void audioEngine.listOutputDevices().then(setDevices);
  }, [open, routingSupported]);

  const doExport = async () => {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soundboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (file: File) => {
    try {
      const backup = JSON.parse(await file.text()) as BackupFile;
      if (backup.version !== 1) throw new Error('Unsupported backup version');
      await importBackup(backup);
      alert('Backup restored.');
    } catch (e) {
      alert(`Import failed: ${e instanceof Error ? e.message : 'invalid file'}`);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings" wide>
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h3 className="mb-2 text-sm font-bold text-muted">Theme</h3>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(THEMES) as ThemeId[]).map((id) => (
              <button
                key={id}
                onClick={() => update({ theme: id })}
                className={
                  'rounded-xl border-2 p-2 text-left transition-all ' +
                  (settings.theme === id
                    ? 'border-accent'
                    : 'border-line hover:border-accent/50')
                }
              >
                <div className="mb-1.5 flex gap-1">
                  {(['accent', 'accent2', 'surface'] as const).map((k) => (
                    <span
                      key={k}
                      className="h-4 w-4 rounded-full border border-black/20"
                      style={{ background: `rgb(${THEMES[id].tokens[k]})` }}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold">{THEMES[id].label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-bold text-muted">Accessibility</h3>
          <Toggle
            label="Large text"
            checked={settings.largeText}
            onChange={(v) => {
              update({ largeText: v });
              document.documentElement.toggleAttribute('data-large-text', v);
            }}
          />
          <Toggle
            label="High contrast"
            checked={settings.highContrast}
            onChange={(v) => {
              update({ highContrast: v });
              document.documentElement.toggleAttribute('data-high-contrast', v);
            }}
          />
          <Toggle
            label="Color-blind friendly"
            checked={settings.colorBlindMode}
            onChange={(v) => {
              update({ colorBlindMode: v });
              document.documentElement.toggleAttribute('data-color-blind', v);
            }}
          />
        </section>

        <section>
          <h3 className="mb-2 text-sm font-bold text-muted">Feel</h3>
          <Toggle
            label="Haptic feedback"
            checked={settings.haptics}
            onChange={(v) => update({ haptics: v })}
          />
          <Toggle
            label="Show waveforms"
            checked={settings.showWaveforms}
            onChange={(v) => update({ showWaveforms: v })}
          />
          <Toggle
            label="Confetti on play"
            checked={settings.confetti}
            onChange={(v) => update({ confetti: v })}
          />
        </section>

        <section>
          <h3 className="mb-2 text-sm font-bold text-muted">Audio output</h3>
          {routingSupported ? (
            <div className="space-y-2">
              <select
                className="field"
                value={settings.outputDeviceId}
                onChange={(e) => update({ outputDeviceId: e.target.value })}
                aria-label="Output device"
              >
                <option value="">System default</option>
                {devices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Output ${i + 1}`}
                  </option>
                ))}
              </select>
              <button onClick={() => void refreshDevices()} className="btn-ghost w-full border border-line">
                🔄 Refresh devices
              </button>
              <p className="text-xs text-muted">
                Route playback to headphones, USB/Bluetooth speakers, or a{' '}
                <strong>virtual audio device</strong> (VB-Cable / BlackHole) to
                pipe sounds into OBS, Discord, Zoom or Teams. See the desktop
                guide for setup.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted">
              {isDesktop()
                ? 'This desktop WebView does not expose per-device routing; route audio at the OS level (see the desktop guide).'
                : 'Per-device output routing needs a Chromium-based browser (Chrome/Edge) or the desktop app.'}
            </p>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-bold text-muted">Backup &amp; data</h3>
          <div className="space-y-2">
            <button onClick={doExport} className="btn-accent w-full">
              ⬇ Export backup (JSON)
            </button>
            <button onClick={() => fileRef.current?.click()} className="btn-ghost w-full border border-line">
              ⬆ Import backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void doImport(f);
                e.target.value = '';
              }}
            />
          </div>
          <p className="mt-3 text-xs text-muted">
            Everything is stored locally on your device (offline-first). Backups
            include your audio so you can move between devices.
          </p>
        </section>
      </div>
    </Modal>
  );
}
