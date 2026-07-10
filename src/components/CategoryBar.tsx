import { useState } from 'react';
import clsx from 'clsx';
import { useStore } from '../store/useStore';
import { PALETTE } from '../store/useStore';

export function CategoryBar() {
  const categories = useStore((s) => s.categories);
  const sounds = useStore((s) => s.sounds);
  const active = useStore((s) => s.activeCategory);
  const setActive = useStore((s) => s.setActiveCategory);
  const addCategory = useStore((s) => s.addCategory);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const countFor = (id: string | null) =>
    id === null ? sounds.length : sounds.filter((s) => s.categoryId === id).length;

  const submit = () => {
    const n = name.trim();
    if (n) addCategory(n, PALETTE[Math.floor(Math.random() * PALETTE.length)]!, '📁');
    setName('');
    setAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CategoryChip
        label="All"
        emoji="🎛️"
        color="rgb(var(--sb-accent))"
        count={countFor(null)}
        active={active === null}
        onClick={() => setActive(null)}
      />
      {categories.map((c) => (
        <CategoryChip
          key={c.id}
          label={c.name}
          emoji={c.emoji}
          color={c.color}
          count={countFor(c.id)}
          active={active === c.id}
          onClick={() => setActive(active === c.id ? null : c.id)}
        />
      ))}
      {adding ? (
        <input
          autoFocus
          value={name}
          placeholder="Category name…"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') setAdding(false);
          }}
          onBlur={submit}
          className="field !w-40 !py-1.5"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="chip border border-dashed border-line text-muted hover:text-accent hover:border-accent"
        >
          ＋ New
        </button>
      )}
    </div>
  );
}

function CategoryChip({
  label,
  emoji,
  color,
  count,
  active,
  onClick,
}: {
  label: string;
  emoji?: string;
  color: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'chip border',
        active
          ? 'text-white border-transparent'
          : 'text-ink border-line bg-elevated hover:border-accent/60',
      )}
      style={active ? { backgroundColor: color, borderColor: color } : undefined}
    >
      {emoji && <span>{emoji}</span>}
      <span>{label}</span>
      <span
        className={clsx(
          'ml-0.5 rounded-full px-1.5 text-[11px]',
          active ? 'bg-black/20' : 'bg-surface text-muted',
        )}
      >
        {count}
      </span>
    </button>
  );
}
