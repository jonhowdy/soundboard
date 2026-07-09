import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { audioEngine } from './audio/AudioEngine';
import { useHotkeys } from './hooks/useHotkeys';
import { isTauri } from './platform';
import { syncGlobalHotkeys, clearGlobalHotkeys } from './platform/globalHotkeys';
import { isSupportedAudioFile } from './utils/audioFiles';
import { TopBar } from './components/TopBar';
import { CategoryBar } from './components/CategoryBar';
import { SoundGrid } from './components/SoundGrid';
import { Mixer } from './components/Mixer';
import { SoundEditor } from './components/SoundEditor';
import { RecordModal } from './components/RecordModal';
import { SettingsModal } from './components/SettingsModal';
import { StatsModal } from './components/StatsModal';

export function App() {
  const init = useStore((s) => s.init);
  const ready = useStore((s) => s.ready);
  const importFiles = useStore((s) => s.importFiles);
  const editingId = useStore((s) => s.editingSoundId);

  const [record, setRecord] = useState(false);
  const [settings, setSettings] = useState(false);
  const [stats, setStats] = useState(false);
  const [dragging, setDragging] = useState(false);

  useHotkeys();

  useEffect(() => {
    void init();
  }, [init]);

  // Desktop: mirror sound hotkeys into OS-level global shortcuts and keep them
  // in sync as sounds are added/edited/removed.
  useEffect(() => {
    if (!isTauri()) return;
    const trigger = (id: string) => useStore.getState().playSound(id);
    let prev = useStore.getState().sounds;
    void syncGlobalHotkeys(prev, trigger);
    const unsub = useStore.subscribe((st) => {
      if (st.sounds !== prev) {
        prev = st.sounds;
        void syncGlobalHotkeys(prev, trigger);
      }
    });
    return () => {
      unsub();
      void clearGlobalHotkeys();
    };
  }, []);

  // Global drag-and-drop import.
  useEffect(() => {
    const onDrag = (e: DragEvent) => {
      e.preventDefault();
      if (e.type === 'dragover') setDragging(true);
      if (e.type === 'dragleave' && e.relatedTarget === null) setDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
        isSupportedAudioFile(f.name),
      );
      if (files.length) void importFiles(files);
    };
    window.addEventListener('dragover', onDrag);
    window.addEventListener('dragleave', onDrag);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDrag);
      window.removeEventListener('dragleave', onDrag);
      window.removeEventListener('drop', onDrop);
    };
  }, [importFiles]);

  if (!ready) {
    return (
      <div className="grid h-full place-items-center">
        <div className="animate-pulse text-center">
          <div className="mb-2 text-5xl">🎚️</div>
          <p className="text-muted">Loading your board…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex min-h-full max-w-6xl flex-col gap-4 p-3 pb-28 sm:p-5"
      onPointerDown={() => audioEngine.unlock()}
    >
      <header className="sticky top-0 z-30 -mx-3 rounded-b-xl2 px-3 pb-3 pt-3 sm:-mx-5 sm:px-5">
        <div className="glass rounded-xl2 p-3 sm:p-4">
          <TopBar
            onOpenRecord={() => setRecord(true)}
            onOpenSettings={() => setSettings(true)}
            onOpenStats={() => setStats(true)}
          />
        </div>
      </header>

      <div className="px-1">
        <CategoryBar />
      </div>

      <main className="flex-1">
        <SoundGrid />
      </main>

      <Mixer />

      {editingId && <SoundEditor />}
      <RecordModal open={record} onClose={() => setRecord(false)} />
      <SettingsModal open={settings} onClose={() => setSettings(false)} />
      <StatsModal open={stats} onClose={() => setStats(false)} />

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-accent/20 backdrop-blur-sm">
          <div className="glass rounded-xl2 border-2 border-dashed border-accent px-10 py-8 text-center">
            <div className="text-5xl">📥</div>
            <p className="mt-2 text-lg font-bold">Drop audio to import</p>
          </div>
        </div>
      )}
    </div>
  );
}
