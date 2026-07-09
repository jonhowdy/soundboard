# Deployment & publishing

One codebase → five targets. The web build in `dist/` is the shared front-end for
every platform.

## 1. Web (PWA)

```bash
npm run build      # → dist/ (static, includes sw.js + manifest)
```

Deploy `dist/` to any static host — **Vercel, Netlify, Cloudflare Pages, GitHub
Pages, S3+CloudFront**. No server required. Requirements:

- **Serve over HTTPS** — service workers, MediaRecorder and the Vibration API
  require a secure context.
- Set a long-cache header on `assets/*` (hashed filenames) and `no-cache` on
  `index.html` so updates ship immediately; the service worker handles the rest
  (`registerType: 'autoUpdate'`).
- Because it's a PWA, users on any OS can "Install to home screen / desktop" and
  it runs offline — this alone covers Windows, macOS, Linux, iOS and Android.

Example (Netlify `netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = "dist"
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## 2. Desktop — Tauri (Windows, macOS, Linux)

```bash
npm create tauri-app@latest       # or: cargo install tauri-cli && npm i -D @tauri-apps/cli
# point tauri.conf.json:
#   build.frontendDist = "../dist"
#   build.beforeBuildCommand = "npm run build"
npm run tauri build               # → native installers
```

Outputs `.msi`/`.exe` (Windows), `.dmg`/`.app` (macOS), `.deb`/`.AppImage`
(Linux) — each ~3–10 MB (native WebView, no bundled Chromium).

**Native capabilities to wire in the Rust core:**
- **Global shortcuts** via `tauri-plugin-global-shortcut` so hotkeys fire while
  the app is unfocused (replaces the web `keydown` listener on desktop).
- **Output-device selection & virtual mic** for routing into OBS/Discord/Zoom —
  document VB-Audio Cable (Windows) / BlackHole (macOS) as the virtual device.

**Signing (required for distribution):**
- Windows: Authenticode cert; sign the `.msi`/`.exe` (SignTool) to avoid
  SmartScreen warnings.
- macOS: Apple Developer ID, `codesign` + **notarize** (`notarytool`) + staple,
  or ship via the Mac App Store.
- CI: `tauri-apps/tauri-action` builds and signs per-OS on tagged releases.

## 3. Mobile — Capacitor (iOS + Android)

```bash
npm i @capacitor/core @capacitor/cli
npx cap init Soundboard com.yourco.soundboard --web-dir=dist
npm run build && npx cap add ios && npx cap add android
npx cap sync
npx cap open ios      # Xcode
npx cap open android  # Android Studio
```

Recommended plugins: `@capacitor/haptics`, `@capacitor/filesystem`,
`@capacitor/share`, `@capacitor-community/sqlite` (swap the storage layer),
plus a background-audio config.

### Apple App Store
1. Enroll in the Apple Developer Program ($99/yr).
2. In Xcode: set bundle id, version/build, signing team; add **microphone usage
   description** (`NSMicrophoneUsageDescription`) — required because we record.
3. Provide app icons (all sizes) and launch screen.
4. Archive → upload to App Store Connect → **TestFlight** for beta.
5. Fill listing: name, subtitle, keywords, description, screenshots (6.7"/6.5"/
   5.5" + iPad), privacy nutrition label (**Data Not Collected** — offline-first
   is a selling point), age rating.
6. Submit for review. Common rejections to pre-empt: justify mic use, ensure any
   downloadable sound packs don't bypass IAP rules, no placeholder content.

### Google Play
1. Google Play Console ($25 one-time).
2. `./gradlew bundleRelease` → signed **AAB** (enable Play App Signing).
3. Declare `RECORD_AUDIO` permission and its rationale.
4. Complete the **Data safety** form (no data collected/shared).
5. Upload to **Internal testing** → Closed → Production. Provide store listing,
   feature graphic, screenshots, content rating questionnaire.
6. Staged rollout (e.g. 10% → 100%).

## 4. Release flow (recommended)
- Tag `vX.Y.Z` → CI builds web + Tauri artifacts → GitHub Release.
- Web auto-deploys from `main`; desktop installers attach to the release; mobile
  goes through TestFlight/Play tracks.
- Keep versions in lockstep across platforms via the root `package.json` version.

## Environment matrix

| Target | Build cmd | Artifact | Store/host |
|--------|-----------|----------|------------|
| Web/PWA | `npm run build` | `dist/` | Vercel/Netlify/CF/S3 |
| Windows | `npm run tauri build` | `.msi`/`.exe` | Direct / MS Store |
| macOS | `npm run tauri build` | `.dmg`/`.app` | Direct / Mac App Store |
| Linux | `npm run tauri build` | `.deb`/`.AppImage` | Direct / Flathub |
| iOS | `npx cap build ios` | `.ipa` | App Store / TestFlight |
| Android | `./gradlew bundleRelease` | `.aab` | Google Play |
