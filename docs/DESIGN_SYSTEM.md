# Design system

A small, token-driven system. Everything themeable is a CSS variable so all six
themes share one component tree.

## Color tokens

Defined per theme in `src/themes/themes.ts` as `R G B` triples and applied to
`<html>` by `applyTheme()`. Tailwind consumes them via
`rgb(var(--sb-token) / <alpha>)` (see `tailwind.config.js`), so opacity modifiers
like `bg-panel/70` work.

| Token | Role |
|-------|------|
| `--sb-surface` | App background |
| `--sb-panel` | Cards, header, modals (usually translucent → glass) |
| `--sb-elevated` | Inputs, list rows, raised chips |
| `--sb-ink` | Primary text |
| `--sb-muted` | Secondary text, icons |
| `--sb-accent` / `--sb-accent2` | Brand gradient (buttons, focus, active state) |
| `--sb-line` | Borders, dividers, scrollbars |

Per-**sound** colors are independent hex values; buttons derive a gradient and an
automatically chosen readable text color (`readableText()` computes luminance).

### Themes
Dark · Light · Neon · Retro · Cyberpunk (default) · Minimal. Adding a theme is one
entry in the `THEMES` record — no component changes. User-created themes (roadmap
M7) persist a token set to the `meta` store.

## Typography

- **Family:** Inter → system-ui fallback stack.
- **Scale (Tailwind):** `text-[10px]`/`[11px]` meta · `text-xs` chips · `text-sm`
  body · `text-base`/`text-lg` titles · `text-2xl` stat figures · `font-black`
  for the wordmark and headline numbers.
- **Large-text mode** bumps the root to 18px via `html[data-large-text]`.

## Spacing, radius, elevation

- 4px base grid; grid gaps `gap-3`/`gap-4`.
- Radii: `rounded-xl` (inputs/icons), `rounded-xl2` = 1.25rem (cards/buttons/
  modals), `rounded-full` (chips/toggles).
- Elevation via layered shadows; `shadow-glow` uses the accent for focus/active.
- **Glassmorphism:** `.glass` = translucent panel + `backdrop-blur-xl` + hairline
  border, used on the header, mixer and modals.

## Component library (`src/components`)

| Component | Purpose |
|-----------|---------|
| `SoundButton` | The core tile: icon/image, title, subtitle, waveform, star, hotkey, ripple/glow/confetti, right-click → edit |
| `SoundGrid` | Responsive 2×2–6×6 grid, paginated into pages with swipe + dots |
| `QueueModal` | Ordered play queue: add-picker, reorder/remove, play-all with now-playing highlight |
| `PackModal` | Sound-pack catalog: install/remove versioned bundles with per-sound chips and preview |
| `BackupModal` | Version history (restore/delete), backup-now, and ZIP/JSON/CSV export + JSON/ZIP import |
| `TopBar` | Search, favorites toggle, random, stop, record/stats/settings, sort tabs, grid-size selector |
| `CategoryBar` | Color chips with counts + inline "new category" |
| `Mixer` | Floating live mixer: per-voice volume/stop + master volume |
| `SoundEditor` | Full editor: identity, color, tags, category, hotkey capture, all FX, auto-style |
| `WaveformEditor` | Trim/crop with draggable region handles, normalize, fades, region preview |
| `RecordModal` | Mic capture → preview → name → save |
| `SettingsModal` | Theme picker, accessibility, feel, backup import/export |
| `StatsModal` | Totals + most/recently played leaderboards |
| `Waveform` | SVG peaks renderer (static or animated) |
| `ui.tsx` | `Modal`, `Slider`, `Toggle`, `formatTime` primitives |

### Interaction & motion
- **Press:** `animate-pop` scale bounce + water-ripple at the cursor.
- **Playing:** `animate-pulseglow` ring on the tile and animated waveform; the
  mixer shows a pinging live indicator.
- **Confetti:** optional burst on play.
- All motion respects `prefers-reduced-motion` (durations collapse to ~0).

## Accessibility baseline
- Every interactive element is a real `button`/`input` with an `aria-label`.
- Modals are `role="dialog" aria-modal`, close on `Esc`, trap the backdrop.
- Toggles use `role="switch" aria-checked`; category chips use `aria-pressed`.
- Modes: large-text, high-contrast (`contrast(1.15)`), color-blind
  (`saturate(0.6)`) — toggled via `data-*` attributes on `<html>`.
- Keyboard: full tab order, `Enter`/`Space` on custom controls, global hotkeys,
  `Esc` to stop.
