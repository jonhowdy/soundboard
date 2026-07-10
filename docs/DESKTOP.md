# Desktop app (Tauri)

The desktop app is a **Tauri v2** shell that loads the exact same web build
(`dist/`) inside the OS-native WebView — no UI is rewritten. It adds two things
the browser sandbox can't: **OS-level global hotkeys** and **audio output-device
routing** for streaming.

Project lives in [`src-tauri/`](../src-tauri):

```
src-tauri/
├─ Cargo.toml            # Rust deps: tauri, tauri-plugin-global-shortcut
├─ tauri.conf.json       # window, bundle, frontendDist = ../dist
├─ build.rs
├─ capabilities/default.json   # grants core + global-shortcut permissions
├─ icons/                # app icons (PNGs generated; add .ico/.icns for win/mac)
└─ src/main.rs           # builder + global-shortcut plugin + platform_info cmd
```

> **Verified:** `cargo build` compiles the app to a native Linux binary
> (`src-tauri/target/debug/soundboard`), linking the `global-hotkey` crate. The
> web bundle stays unchanged and the Tauri plugin is lazy-loaded, so browser
> users never download it.

## Prerequisites

- **Rust** (stable) — <https://rustup.rs>
- **Node** 20+
- **Linux only:** system libraries
  ```bash
  sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev \
    libayatana-appindicator3-dev libssl-dev build-essential
  ```
  (macOS needs Xcode command-line tools; Windows needs the WebView2 runtime,
  preinstalled on Win 11 + MSVC build tools.)

## Run & build

```bash
npm install
npm run desktop:dev     # tauri dev — hot-reloads the Vite dev server in a native window
npm run desktop:build   # tauri build — produces installers for the current OS
```

`desktop:build` runs `npm run build` first (via `beforeBuildCommand`) and emits:

| OS | Artifacts |
|----|-----------|
| Windows | `.msi`, `.exe` (NSIS) |
| macOS | `.dmg`, `.app` |
| Linux | `.deb`, `.AppImage`, `.rpm` |

under `src-tauri/target/release/bundle/`.

## Global hotkeys

On the web, hotkeys use a `keydown` listener that only fires while the window is
focused. On desktop, `src/platform/globalHotkeys.ts` registers each sound's
hotkey as an **OS-level global shortcut** (via `tauri-plugin-global-shortcut`),
so a key triggers its sound even when another app is focused — what streamers
expect. The bridge:

- detects the desktop runtime (`isTauri()`),
- converts our combo format to Tauri accelerators (`toAccelerator`, unit-tested),
- resyncs whenever the sound list changes, and
- is a **no-op on web**, where `useHotkeys` keeps handling focused keypresses
  (the two never double-fire — the web listener bails out under Tauri).

## Audio routing → OBS / Discord / Zoom / Teams

The soundboard can send playback to any output device via
`AudioContext.setSinkId` (Settings → **Audio output**). To feed sounds into a
streaming/meeting app, route playback to a **virtual audio device**, then select
that device as the *microphone* in OBS/Discord/etc.

| OS | Virtual device |
|----|----------------|
| Windows | [VB-Audio Cable](https://vb-audio.com/Cable/) (or Voicemeeter) |
| macOS | [BlackHole](https://existential.audio/blackhole/) (2ch) |
| Linux | PipeWire/PulseAudio null sink (`pactl load-module module-null-sink`) |

Typical setup:
1. Install the virtual device.
2. Soundboard → Settings → Audio output → select the virtual cable.
3. In OBS: add an *Audio Input Capture* on the cable, or in Discord/Zoom set the
   cable as your input device.
4. To also hear yourself, create a multi-output device (macOS Audio MIDI Setup)
   or use Voicemeeter (Windows) to fan out to the cable **and** your headphones.

> Note: WebView `setSinkId` support varies (great on Windows WebView2, limited on
> Linux WebKitGTK). Where unsupported, route at the OS level instead — the
> Settings panel detects this and says so.

## Icons & signing (for distribution)

- The repo ships generated **PNG** icons. For Windows/macOS bundles also add
  `icons/icon.ico` and `icons/icon.icns` — generate all sizes at once with
  `npm run tauri icon path/to/logo.png`.
- **Windows:** sign the `.msi`/`.exe` with an Authenticode certificate to avoid
  SmartScreen warnings.
- **macOS:** sign with a Developer ID, then **notarize** (`notarytool`) and
  staple, or ship via the Mac App Store.
- **CI:** `tauri-apps/tauri-action` builds and signs per-OS on tagged releases
  (see `.github/workflows/`).
