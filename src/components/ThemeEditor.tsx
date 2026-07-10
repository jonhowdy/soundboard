import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { Modal } from './ui';
import { THEMES, TOKEN_LABELS, hexToTriple, tripleToHex } from '../themes/themes';
import type { CustomTheme, ThemeTokens } from '../types';

/**
 * Create or edit a custom theme by tweaking its eight color tokens, with a live
 * preview. Saving persists the theme and switches to it.
 */
export function ThemeEditor({
  editing,
  onClose,
}: {
  editing: CustomTheme | null; // null → create a new theme
  onClose: () => void;
}) {
  const addCustomTheme = useStore((s) => s.addCustomTheme);
  const updateCustomTheme = useStore((s) => s.updateCustomTheme);
  const setTheme = useStore((s) => s.updateSettings);

  const [label, setLabel] = useState(editing?.label ?? 'My theme');
  const [tokens, setTokens] = useState<ThemeTokens>(
    editing?.tokens ?? { ...THEMES.cyberpunk.tokens },
  );

  const setToken = (key: keyof ThemeTokens, hex: string) =>
    setTokens((t) => ({ ...t, [key]: hexToTriple(hex) }));

  const previewStyle = useMemo(
    () =>
      ({
        // Scope the token variables to the preview card only.
        '--sb-surface': tokens.surface,
        '--sb-panel': tokens.panel,
        '--sb-ink': tokens.ink,
        '--sb-muted': tokens.muted,
        '--sb-accent': tokens.accent,
        '--sb-accent2': tokens.accent2,
        '--sb-line': tokens.line,
      }) as React.CSSProperties,
    [tokens],
  );

  const save = () => {
    const name = label.trim() || 'My theme';
    if (editing) {
      updateCustomTheme(editing.id, { label: name, tokens });
      setTheme({ theme: editing.id });
    } else {
      const created = addCustomTheme(name, tokens);
      setTheme({ theme: created.id });
    }
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={editing ? 'Edit theme' : 'Create theme'} wide>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Name</span>
            <input className="field" value={label} onChange={(e) => setLabel(e.target.value)} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            {TOKEN_LABELS.map(({ key, label: tLabel }) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="color"
                  value={tripleToHex(tokens[key])}
                  onChange={(e) => setToken(key, e.target.value)}
                  aria-label={tLabel}
                  className="h-8 w-10 shrink-0 cursor-pointer rounded border border-line bg-transparent"
                />
                <span className="text-muted">{tLabel}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Live preview */}
        <div>
          <span className="mb-1.5 block text-sm text-muted">Preview</span>
          <div
            style={previewStyle}
            className="overflow-hidden rounded-xl2 border border-line bg-surface p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black text-ink">🎚️ Soundboard</span>
              <span
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, rgb(var(--sb-accent)), rgb(var(--sb-accent2)))',
                }}
              >
                Random
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['accent', 'accent2', 'panel'].map((c, i) => (
                <div
                  key={i}
                  className="flex aspect-square flex-col justify-end rounded-xl p-2 text-[10px] font-bold text-white"
                  style={{
                    backgroundImage: `linear-gradient(150deg, rgb(var(--sb-${c})), #00000055)`,
                  }}
                >
                  Sound
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">Muted caption text sample.</p>
            <div className="mt-2 h-px bg-line" />
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost border border-line">
          Cancel
        </button>
        <button onClick={save} className="btn-accent">
          {editing ? 'Save changes' : 'Create & apply'}
        </button>
      </div>
    </Modal>
  );
}
