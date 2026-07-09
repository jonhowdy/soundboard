import type { ThemeId } from '../types';

/**
 * Theme definitions expressed as `R G B` triples (space separated) so Tailwind's
 * `rgb(var(--token) / <alpha>)` syntax can apply opacity. Applying a theme sets
 * these CSS variables on <html>.
 */
type Tokens = {
  surface: string;
  panel: string;
  elevated: string;
  ink: string;
  muted: string;
  accent: string;
  accent2: string;
  line: string;
};

export const THEMES: Record<ThemeId, { label: string; tokens: Tokens }> = {
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

export function applyTheme(id: ThemeId): void {
  const theme = THEMES[id];
  const root = document.documentElement;
  const t = theme.tokens;
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
