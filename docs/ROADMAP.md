# Development roadmap

Incremental milestones, each independently shippable and testable. **M0–M2 are
implemented in this repository.**

## ✅ M0 — Foundation *(done)*
Vite + React + TS + Tailwind scaffold, theming, IndexedDB layer, domain types,
CI (typecheck → test → build), PWA manifest + service worker. Offline synth seeds
a usable library on first run.

## ✅ M1 — Core playback *(done)*
Web Audio engine with decoded-buffer cache, multi-voice playback, master gain.
Sound grid (2×2–6×6), sound buttons with icon/title/subtitle/color/waveform/
favorite/hotkey, press/ripple/glow animations. Live mixer.
*Verified: 12 buttons render, tap plays < 30 ms, mixer tracks voices, 0 console errors.*

## ✅ M2 — Library management *(done)*
Categories (CRUD, color, counts), search (name/tag/category), sort, favorites with
pin-to-top, full sound editor (identity, tags, color, hotkey capture, FX:
volume/speed/pitch/fade/reverse/loop), duplicate/delete, import (drag-drop +
picker, 7 formats), recording, JSON backup import/export, statistics, six themes,
accessibility modes.

## 🟡 M3 — Audio editing & AI assist *(core done)*
**Done:** waveform-based **trim/crop** editor with draggable region handles and
region preview, **normalize** (peak → −0.1 dBFS), baked **fade in/out**, and
**reverse** — all pure, unit-tested transforms (`src/audio/edit.ts`) re-encoded to
WAV on apply. Offline **AI auto-style**: infers emoji/color/tags from a title
(`src/utils/suggest.ts`), one click in the editor.
*Verified in-browser: right-click → Trim & edit → select region → normalize →
preview → apply, 0 console errors; 12 new tests.*

**Remaining:** silence auto-trim, noise reduction (RNNoise WASM), format
conversion (ffmpeg.wasm), merge sounds, duplicate detection via content hash,
ML-based category suggestions.

## 🔜 M4 — Desktop (Tauri)
Wrap `dist/` in Tauri. Native **global hotkeys** (fire while unfocused), output-
device selection, and a **virtual audio device** bridge (VB-Cable/BlackHole
guidance) so sounds route into OBS/Discord/Zoom/Teams. Signed installers for
Win/macOS/Linux via CI.

## 🔜 M5 — Mobile (Capacitor)
iOS + Android shells over the same bundle. Native haptics, background audio,
share-sheet import, Files/Photos access, landscape/portrait, swipe-between-pages,
SQLite storage plugin. TestFlight + Play internal testing.

## 🔜 M6 — Backup & resilience
Automatic daily local backups with version history + one-tap restore. ZIP and CSV
exports. Import from ZIP archives.

## 🔜 M7 — Personalization & packs
User-created themes, favorite collections, installable **sound packs** (signed,
versioned bundles) with an in-app catalog. Queue mode with reorder/auto-advance.

## 🔜 M8 — Cloud sync (opt-in)
Supabase auth + Postgres schema (see DATABASE.md), content-addressed encrypted
audio, last-write-wins with offline outbox, cross-device sync.

## 🔜 M9 — Integrations & streaming
Twitch (chat/bits/subs triggers), Discord bot + push-to-talk, OBS WebSocket +
browser source, Stream Deck plugin.

---

## Future feature ideas
- MIDI / gamepad / Stream Deck hardware triggers
- Ducking (auto-lower mic/music while an FX plays)
- Collaborative shared boards for teams/streamers
- Text-to-speech and AI-generated SFX buttons
- Soundscapes / ambience loops with crossfade
- Per-button cooldowns and "anti-spam" limits
- Marketplace for creator sound packs (revenue share)
- Voice-changer chain (reverb, echo, robot, chipmunk) on live mic
- Timeline/scene sequencer for multi-sound cues
- Localization (i18n) and RTL support
