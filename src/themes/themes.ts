import type { CustomTheme, ThemeId, ThemeTokens } from '../types';

/**
 * Theme tokens are `R G B` triples (space separated) so Tailwind's
 * `rgb(var(--token) / <alpha>)` syntax can apply opacity. Applying a theme sets
 * these CSS variables on <html>. Built-in themes live here; user-created themes
 * share the exact same token shape and resolve through the same path.
 */
export const THEMES: Record<ThemeId, { label: string; tokens: ThemeTokens }> = {
  dark: {
    label: 'Dark',
    tokens: {
      surface: '11 11 18',
      panel: '20 20 31',
      elevated: '30 30 45',
      ink: '237 237 245',
      muted: '148 148 168',
      accent: '124 58 237',
      accent2: '236 72 153',
      line: '42 42 60',
    },
  },
  light: {
    label: 'Light',
    tokens: {
      surface: '245 246 250',
      panel: '255 255 255',
      elevated: '255 255 255',
      ink: '20 22 34',
      muted: '100 106 128',
      accent: '99 102 241',
      accent2: '217 70 239',
      line: '224 227 236',
    },
  },
  neon: {
    label: 'Neon',
    tokens: {
      surface: '5 8 20',
      panel: '12 16 38',
      elevated: '18 24 54',
      ink: '224 255 255',
      muted: '120 200 220',
      accent: '0 255 200',
      accent2: '255 0 170',
      line: '30 60 90',
    },
  },
  retro: {
    label: 'Retro',
    tokens: {
      surface: '30 22 18',
      panel: '44 33 26',
      elevated: '58 44 34',
      ink: '250 235 208',
      muted: '190 160 120',
      accent: '235 150 60',
      accent2: '210 90 70',
      line: '78 58 44',
    },
  },
  cyberpunk: {
    label: 'Cyberpunk',
    tokens: {
      surface: '10 6 22',
      panel: '20 10 40',
      elevated: '32 16 58',
      ink: '240 230 255',
      muted: '170 140 210',
      accent: '250 60 200',
      accent2: '60 220 255',
      line: '60 30 90',
    },
  },
  minimal: {
    label: 'Minimal',
    tokens: {
      surface: '250 250 250',
      panel: '255 255 255',
      elevated: '250 250 250',
      ink: '24 24 27',
      muted: '113 113 122',
      accent: '24 24 27',
      accent2: '82 82 91',
      line: '228 228 231',
    },
  },
};

export const TOKEN_LABELS: { key: keyof ThemeTokens; label: string }[] = [
  { key: 'surface', label: 'Background' },
  { key: 'panel', label: 'Panel' },
  { key: 'elevated', label: 'Elevated' },
  { key: 'ink', label: 'Text' },
  { key: 'muted', label: 'Muted text' },
  { key: 'accent', label: 'Accent' },
  { key: 'accent2', label: 'Accent 2' },
  { key: 'line', label: 'Lines' },
];

function isBuiltIn(id: string): id is ThemeId {
  return Object.prototype.hasOwnProperty.call(THEMES, id);
}

/** Resolve a theme id (built-in or custom) to its tokens, with a safe fallback. */
export function resolveTokens(id: string, custom: CustomTheme[] = []): ThemeTokens {
  if (isBuiltIn(id)) return THEMES[id].tokens;
  return custom.find((c) => c.id === id)?.tokens ?? THEMES.cyberpunk.tokens;
}

export function applyTheme(id: string, custom: CustomTheme[] = []): void {
  const t = resolveTokens(id, custom);
  const root = document.documentElement;
  root.style.setProperty('--sb-surface', t.surface);
  root.style.setProperty('--sb-panel', t.panel);
  root.style.setProperty('--sb-elevated', t.elevated);
  root.style.setProperty('--sb-ink', t.ink);
  root.style.setProperty('--sb-muted', t.muted);
  root.style.setProperty('--sb-accent', t.accent);
  root.style.setProperty('--sb-accent2', t.accent2);
  root.style.setProperty('--sb-line', t.line);
  root.dataset.theme = id;
}

/** Whether a theme's background is light (used for status-bar contrast). */
export function isTokensLight(tokens: ThemeTokens): boolean {
  const [r, g, b] = tokens.surface.split(/\s+/).map(Number) as [number, number, number];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

export function isThemeLight(id: string, custom: CustomTheme[] = []): boolean {
  return isTokensLight(resolveTokens(id, custom));
}

/**
 * Mirror accessibility settings onto <html> data-attributes (consumed by
 * index.css). Must run on init as well as on toggle, so persisted settings
 * survive a reload.
 */
export function applyAccessibility(opts: {
  largeText: boolean;
  highContrast: boolean;
  colorBlindMode: boolean;
}): void {
  const root = document.documentElement;
  root.toggleAttribute('data-large-text', opts.largeText);
  root.toggleAttribute('data-high-contrast', opts.highContrast);
  root.toggleAttribute('data-color-blind', opts.colorBlindMode);
}

// --- hex <-> "R G B" triple conversion for the color-picker UI -----------------

export function tripleToHex(triple: string): string {
  const [r, g, b] = triple.split(/\s+/).map(Number);
  const h = (n: number) => Math.max(0, Math.min(255, n | 0)).toString(16).padStart(2, '0');
  return `#${h(r ?? 0)}${h(g ?? 0)}${h(b ?? 0)}`;
}

export function hexToTriple(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `${r} ${g} ${b}`;
}
