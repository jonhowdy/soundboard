# Changelog

All notable changes to this project are documented here. The format is loosely
based on [Keep a Changelog](https://keepachangelog.com/); the project follows
semantic versioning once it reaches 1.0.

## [Unreleased]

The `0.1.x` line builds the product milestone by milestone. Every milestone ships
green (typecheck + unit/integration + e2e + production build) — see
[docs/ROADMAP.md](docs/ROADMAP.md) for the full plan and status.

### Added

- **Core web app / PWA (M0–M2).** Low-latency Web Audio engine (decoded-buffer
  cache, multi-voice mixing, per-sound FX: volume, speed, pitch, fade, reverse,
  loop); responsive 2×2–6×6 sound grid with gradient buttons (emoji/image,
  waveform, favorite, hotkey, ripple/glow/confetti); categories, search, sort,
  favorites pin-to-top, keyboard hotkeys, mic recording, drag-and-drop import
  (MP3/WAV/AAC/M4A/OGG/FLAC/AIFF), random, statistics, six themes, accessibility
  modes, offline-first IndexedDB storage, service worker. Seeds 12 synthesized
  royalty-free sounds so it's usable offline on first launch.
- **Audio editing + AI assist (M3).** Waveform trim/crop editor with draggable
  region + preview, normalize, baked fades, reverse; one-click offline "auto-style"
  that infers emoji/color/tags from a title.
- **Desktop shell — Tauri (M4).** Native binary wrapping the web build; OS-level
  global hotkeys (fire while unfocused) and audio output-device routing for
  OBS/Discord/Zoom via a virtual cable.
- **Mobile shell — Capacitor (M5).** iOS/Android over the same codebase with
  native haptics, theme-aware status bar, Android back-button handling and
  safe-area insets.
- **Queue mode + multi-page board (M5.5).** Ordered play queue with reorder/remove
  and sequential auto-advance; board pagination with swipe, arrows and page dots.
- **Sound packs (M7).** Installable, versioned catalog — 5 built-in packs rendered
  offline from the synth palette; one-tap install/remove with persisted state.
- **Backup & resilience (M6).** Automatic daily backups with version history and
  one-tap restore; ZIP (manifest + raw audio), JSON and CSV export; JSON/ZIP import.
- **Custom themes (M7).** Theme editor over the eight color tokens with a live
  preview; custom themes persist and sit alongside built-ins in the picker.
- **Testing & CI.** 61 Vitest unit/integration tests and 14 Playwright end-to-end
  tests, plus ESLint. CI runs three jobs on every push/PR: lint+build+unit, e2e,
  and a native desktop `cargo build`.

### Fixed

- Accessibility modes (large text, high contrast, color-blind) are re-applied on
  app launch, so persisted settings survive a reload.
- Escape now closes only the topmost modal in nested-modal situations (e.g. the
  trim editor inside the sound editor) and no longer also stops playback while a
  modal is open.
- Queue playback skips an unplayable sound instead of stalling.
- The recorder revokes stale audio preview URLs (memory leak on re-record).
- `npm run lint` actually works — ESLint and its plugins are installed and the
  whole codebase passes with zero warnings; `tsc --noEmit` now also covers the
  e2e suite and Playwright config.
- The sound grid no longer re-renders on unrelated store changes (live mixer
  voice churn) thanks to a shallow-compared selector.

### Notes

- Everything is offline-first and local by default: no ads, no tracking, no
  account required. Cloud sync (opt-in, encrypted) is designed but not yet built —
  see [docs/DATABASE.md](docs/DATABASE.md).
