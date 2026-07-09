import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Modal } from './ui';

export function StatsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sounds = useStore((s) => s.sounds);

  const stats = useMemo(() => {
    const totalPlays = sounds.reduce((n, s) => n + s.playCount, 0);
    const played = [...sounds].filter((s) => s.playCount > 0);
    const mostPlayed = [...sounds].sort((a, b) => b.playCount - a.playCount).slice(0, 5);
    const recent = [...sounds]
      .filter((s) => s.lastPlayed)
      .sort((a, b) => (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0))
      .slice(0, 5);
    const favorites = sounds.filter((s) => s.favorite).length;
    return { totalPlays, playedCount: played.length, mostPlayed, recent, favorites };
  }, [sounds]);

  return (
    <Modal open={open} onClose={onClose} title="Statistics" wide>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total plays" value={stats.totalPlays} />
        <Stat label="Sounds" value={sounds.length} />
        <Stat label="Played" value={stats.playedCount} />
        <Stat label="Favorites" value={stats.favorites} />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-bold text-muted">🔥 Most played</h3>
          <RankedList
            items={stats.mostPlayed.map((s) => ({
              id: s.id,
              emoji: s.emoji,
              title: s.title,
              meta: `${s.playCount} plays`,
            }))}
          />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-muted">🕑 Recently played</h3>
          <RankedList
            items={stats.recent.map((s) => ({
              id: s.id,
              emoji: s.emoji,
              title: s.title,
              meta: s.lastPlayed ? new Date(s.lastPlayed).toLocaleTimeString() : '',
            }))}
          />
        </div>
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl2 bg-elevated p-4 text-center">
      <div className="text-2xl font-black text-accent">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function RankedList({
  items,
}: {
  items: { id: string; emoji?: string; title: string; meta: string }[];
}) {
  if (items.length === 0)
    return <p className="text-sm text-muted">Nothing played yet.</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={it.id} className="flex items-center gap-3 rounded-xl bg-elevated/60 px-3 py-2">
          <span className="w-4 text-center text-sm font-bold text-muted">{i + 1}</span>
          <span className="text-lg">{it.emoji ?? '🔊'}</span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{it.title}</span>
          <span className="text-xs text-muted">{it.meta}</span>
        </li>
      ))}
    </ul>
  );
}
