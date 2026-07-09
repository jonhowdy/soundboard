# Architecture

The app is a **layered, offline-first single-page application**. Every platform
(web, desktop, mobile) runs the *same* compiled front-end; only the shell around
it changes.

```
┌──────────────────────────────────────────────────────────────┐
│                      Presentation (React)                      │
│  App.tsx · TopBar · CategoryBar · SoundGrid · SoundButton      │
│  Mixer · SoundEditor · Record/Settings/Stats modals · ui kit   │
└───────────────▲───────────────────────────────▲───────────────┘
                │ selectors / actions           │ imperative
┌───────────────┴───────────────┐   ┌───────────┴───────────────┐
│      State (Zustand store)     │   │   Audio (AudioEngine)      │
│  single source of truth        │◄──┤  Web Audio graph, voices,  │
│  actions orchestrate the rest  │   │  FX, waveform, mixer bus   │
└───────────────▲────────────────┘   └────────────────────────────┘
                │ async persistence
┌───────────────┴────────────────┐
│   Persistence (IndexedDB/idb)   │
│  sounds · categories · blobs    │
│  meta(settings, flags)          │
└─────────────────────────────────┘
```

## Layers & responsibilities

### Presentation (`src/components`, `src/App.tsx`)
Pure React. Components read state through Zustand **selectors** (so a component
only re-renders when the slice it subscribes to changes) and call **actions**.
No component talks to IndexedDB or the AudioContext directly — that keeps the UI
portable and testable. `ui.tsx` is a small primitive kit (Modal, Slider, Toggle).

### State (`src/store/useStore.ts`)
The single source of truth and the **only** orchestration layer. Actions are the
seam where the three subsystems meet — e.g. `playSound` updates statistics
(store) → persists them (DB) → triggers a voice (engine) → fires haptics. Derived
data (`visibleSounds`) is computed here so filtering/sorting logic is unit-tested
in isolation.

### Audio (`src/audio/AudioEngine.ts`)
A framework-agnostic class wrapping the Web Audio API. It owns the DSP graph:
decoded `AudioBuffer` cache → per-trigger `AudioBufferSourceNode` → per-voice
`GainNode` → shared **master** `GainNode` → destination. It exposes an
`onVoicesChanged` callback that the store subscribes to, so the live mixer stays
in sync without polling. Pure, dependency-free logic (`computeWaveform`) is
`static` for easy testing.

### Persistence (`src/db/database.ts`)
A thin promise API over IndexedDB. **Metadata and binaries are separated**: the
`sounds`/`categories` stores hold small JSON records that drive every UI read,
while raw audio lives in the `blobs` store keyed by `blobKey`. This is what lets
the library scale to 10k+ sounds without the grid ever loading megabytes.

## Key data flows

**Cold start** → `App` calls `store.init()` → load settings, apply theme, seed on
first run, load metadata, render immediately, then **decode audio buffers in the
background** and backfill duration + waveform. The board is interactive before
decoding finishes; the first tap on an undecoded sound decodes on demand.

**Play** → `SoundButton.onClick` → `store.playSound(id)` → engine wires up a
voice (< 30 ms because the buffer is already decoded) → store increments
`playCount`/`lastPlayed` and persists → mixer reflects the new voice.

**Import** → drop/pick files → `store.importFiles` → write blob → decode →
compute waveform → persist `Sound` → append to state. Undecodable exotic formats
still import and decode lazily on first play.

**Hotkeys** → `useHotkeys` attaches one global `keydown` listener, ignores text
inputs, maps the serialized combo to a sound and plays it. `Esc` = stop-all.

## Design principles applied

- **SOLID / separation of concerns** — UI, state, audio and storage are
  independent modules with narrow interfaces; you can swap IndexedDB for SQLite
  (mobile) or the Web Audio engine for a native one without touching components.
- **Single source of truth** — all mutable state lives in one store; the DB and
  audio engine are side-effect targets, not competing state.
- **Offline-first** — no network is on the critical path; cloud sync is additive.
- **Strong typing** — `src/types` is the shared contract; `strict` +
  `noUncheckedIndexedAccess` are on.
- **Progressive enhancement** — haptics, `detune`, `vibrate`, MediaRecorder are
  all feature-detected and degrade gracefully.

## Where platform shells plug in

| Concern | Web | Tauri (desktop) | Capacitor (mobile) |
|---------|-----|-----------------|--------------------|
| Storage | IndexedDB | IndexedDB (WebView) or SQLite plugin | SQLite plugin |
| Global hotkeys | `window` keydown | Tauri global-shortcut (works unfocused) | n/a |
| Audio output routing | default device | Rust CoreAudio/WASAPI + virtual mic | native |
| Haptics | Vibration API | — | Capacitor Haptics |
| File import | drag/drop + picker | native dialog | share sheet / Files |

The `storage` object and `audioEngine` are the two interfaces a native shell
would re-implement — everything above them is shared verbatim.
