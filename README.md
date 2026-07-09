# 🎚️ Soundboard

A modern, professional, **cross-platform** soundboard — play sounds, memes, music
clips, effects, applause, movie quotes and custom recordings with one tap, at
near-zero latency. Inspired by Stream Deck, Voicemod, Spotify and the Apple/Material
design languages.

> **Status:** the **web app** (this repository's core) is fully implemented,
> tested and production-buildable. It is a PWA that already runs offline on
> Windows, macOS, Linux, iOS, Android and any modern browser. The desktop
> (Tauri) and native-mobile (Capacitor) shells wrap this exact codebase — see
> the [roadmap](docs/ROADMAP.md) and [deployment guide](docs/DEPLOYMENT.md).

<p align="center"><em>Right-click (or long-press) any button to edit it · Esc stops everything · number keys 1–9 trigger the seeded sounds.</em></p>

---

## ✨ What's implemented today

| Area | Highlights |
|------|-----------|
| **Instant playback** | Web Audio API engine; buffers are decoded & cached up front so a tap only wires `BufferSource → Gain → master` (sub-30 ms) |
| **Sound buttons** | Emoji/image icon, title, subtitle, custom color gradient, live waveform, favorite star, hotkey badge, press/ripple/glow/confetti animations |
| **Grid** | Responsive 2×2 → 6×6 layouts, auto-resizing tiles |
| **Playback FX** | Volume, speed, pitch (detune), fade in/out, reverse, loop, one-shot/hold modes |
| **Multi-playback + mixer** | Play many sounds at once; live mixer with per-voice volume, mute/stop, master volume |
| **Categories** | Color-coded, emoji, unlimited, live counts |
| **Search & sort** | By name, tag, category; sort by recent/A–Z/most-played/newest |
| **Favorites** | Toggle + auto-pin to top |
| **Hotkeys** | Assign `F1`, `Ctrl+1`, `Shift+A`, `Space`, custom combos; global listener |
| **Recording** | Capture from mic/USB/Bluetooth (MediaRecorder), preview, name, save |
| **Import/Export** | Drag-and-drop, file picker, MP3/WAV/AAC/M4A/OGG/FLAC/AIFF; full JSON backup with embedded audio |
| **Random & queue** | Random from library/category/favorites |
| **Themes** | Dark, Light, Neon, Retro, Cyberpunk, Minimal (CSS-variable driven) |
| **Statistics** | Play counts, most/recently played, totals |
| **Accessibility** | Keyboard nav, ARIA, large-text, high-contrast, color-blind mode, reduced-motion |
| **Offline-first** | IndexedDB storage + service-worker precache; no account required |
| **Security** | No ads, no tracking, no backend needed, local-only data |

See [`docs/`](docs/) for the full architecture, design system, roadmap, testing,
deployment and store-publishing guides.

---

## 🚀 Quick start

```bash
npm install
npm run dev        # http://localhost:5173 — hot-reloading dev server
```

The app seeds itself on first launch with 12 synthesized, royalty-free effects so
it's useful immediately, fully offline.

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Typecheck + production build (outputs `dist/`, incl. PWA service worker) |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit + integration suite |
| `npm run test:watch` | Vitest in watch mode |
| `npm run e2e` | Playwright end-to-end tests (see `docs/TESTING.md`) |

---

## 🧱 Technology stack & the decisions behind it

**Frontend — React 18 + TypeScript + Tailwind CSS + Vite + Zustand.**
Vite gives sub-second HMR and a tiny, tree-shaken production bundle (~63 KB gzip).
Zustand is a 1 KB store with no boilerplate and no context re-render tax — ideal
for a latency-sensitive UI. Tailwind + CSS variables make the six themes trivial.

**Audio — Web Audio API** (`src/audio/AudioEngine.ts`). Chosen over `<audio>`
elements because it exposes a real DSP graph: sample-accurate scheduling, gain
automation for fades, `playbackRate`/`detune`, buffer reversal and true
simultaneous voices — all required by the spec and impossible with plain media
elements.

**Storage — IndexedDB** (via `idb`). Audio blobs live in a dedicated store keyed
separately from metadata, so the reads that drive the UI never touch large
binaries. This scales to 10k+ sounds. `localStorage` was rejected (5 MB cap,
synchronous, strings only).

**Desktop — Tauri (recommended over Electron).** Tauri ships the OS's native
WebView instead of bundling Chromium, so installers are ~3–10 MB vs ~120 MB,
idle RAM is a fraction of Electron's, and the Rust core gives us native global
hotkeys and low-latency audio output/routing (CoreAudio/WASAPI/ALSA). The same
`dist/` web build is the Tauri front-end — **zero UI rewrite.**

**Mobile — Capacitor (recommended over React Native / Flutter).** The user's
stated priorities are *portability and maintainability*. Capacitor wraps the
**exact same React/TS/Tailwind codebase** as web and desktop, giving one UI to
maintain across five platforms, while still exposing native plugins (haptics,
filesystem, share sheet, background audio). React Native would fork the UI layer;
Flutter would fork the entire language and codebase. Capacitor keeps a single
source of truth — the right call for a small team. (If the product later needs
truly native audio latency on mobile, a React Native rewrite of just the audio
module is the escape hatch — noted in the roadmap.)

**Backend (optional, for cloud sync) — Supabase** (Postgres + Auth + Storage).
Not required for the app to work; sync is strictly opt-in and end-to-end
encrypted. Schema in [`docs/DATABASE.md`](docs/DATABASE.md).

---

## 🗂️ Repository layout

```
soundboard/
├─ src/
│  ├─ audio/          # Web Audio engine (playback, FX, waveform, mixer)
│  ├─ components/     # React component library (buttons, grid, modals, mixer, UI kit)
│  ├─ data/           # First-run seed library
│  ├─ db/             # IndexedDB persistence layer
│  ├─ hooks/          # useHotkeys, useRecorder
│  ├─ store/          # Zustand global store (single source of truth)
│  ├─ themes/         # Theme tokens + applyTheme()
│  ├─ types/          # Shared domain model
│  ├─ utils/          # Audio-file helpers, offline synth
│  ├─ test/           # Vitest unit + integration tests
│  ├─ App.tsx         # Composition root
│  └─ main.tsx        # Entry point
├─ public/            # Icons, favicon, PWA assets
├─ docs/              # Architecture, DB, design system, roadmap, testing, deployment
├─ .github/workflows/ # CI (typecheck → test → build)
└─ vite.config.ts     # Vite + PWA config
```

Full breakdown and data flow in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## 📚 Documentation index

1. [Architecture](docs/ARCHITECTURE.md) — layers, data flow, module responsibilities
2. [Database design](docs/DATABASE.md) — local IndexedDB + optional cloud Postgres
3. [Design system](docs/DESIGN_SYSTEM.md) — tokens, type scale, components, motion
4. [Wireframes](docs/WIREFRAMES.md) — screen-by-screen layouts
5. [Roadmap](docs/ROADMAP.md) — milestones M0–M9, future features
6. [Testing strategy](docs/TESTING.md) — unit/integration/e2e pyramid
7. [Deployment & publishing](docs/DEPLOYMENT.md) — web, Tauri desktop, App Store, Google Play
8. [Maintenance](docs/MAINTENANCE.md) — dependency, release and support practices

---

## 📄 License

MIT — free for commercial use or open-source release.
