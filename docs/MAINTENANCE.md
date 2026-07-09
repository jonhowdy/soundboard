# Maintenance recommendations

## Dependencies
- **Renovate/Dependabot** for automated dependency PRs; CI must pass before merge.
- Pin major versions; review React/Vite/Tailwind majors deliberately (they can
  carry breaking changes). Run `npm audit` in CI and triage.
- Keep the dependency surface small — the app ships with ~7 runtime deps on
  purpose. New deps need justification (size, maintenance, license).

## Code health
- `npm run typecheck` and `npm test` are the pre-merge gate (already in CI).
- `strict` + `noUncheckedIndexedAccess` stay **on**; they catch real bugs.
- Keep the layer boundaries intact: components never import `db/` or the
  `AudioContext` directly — only the store orchestrates side effects. Reviews
  should reject leaks across those seams.
- Add a test with every bug fix (regression) and every store action.

## Performance budgets
- JS bundle target **< 250 KB gzip** (currently ~63 KB). Watch it in CI with a
  size check; lazy-load heavy future modules (ffmpeg.wasm, noise reduction).
- Playback latency target **< 30 ms** — never move decoding onto the play path;
  keep the background pre-decode in `init`.
- Grid must stay smooth at 10k sounds: if the DOM grows too large, add windowing
  (virtualized grid) — the store already returns a filtered slice.

## Data & migrations
- Bump `DB_VERSION` and add guarded `upgrade` steps for any schema change; never
  drop stores. Test migrations against a populated DB.
- The `BackupFile.version` field gates import compatibility — increment and write
  an upgrader when the backup shape changes.
- Encourage users to export backups; surface "last backup" age in Settings once
  automatic backups land (M6).

## Observability (opt-in, privacy-preserving)
- No third-party trackers (a product promise). If crash reporting is added, make
  it opt-in, self-hosted (e.g. GlitchTip/Sentry self-host), and strip PII/audio.
- Log to the console behind a debug flag; never log audio content.

## Releases & support
- Semantic versioning; one version across all platforms (root `package.json`).
- Tag → CI builds artifacts → GitHub Release with notes. Staged rollouts on
  mobile.
- Maintain a `CHANGELOG.md`; keep a short `SECURITY.md` with a disclosure contact.
- Triage rotation for issues; label by area (audio/ui/storage/platform).

## Platform upkeep
- **Apple/Google** push SDK/target-API deadlines yearly — budget time to bump
  Capacitor and native toolchains before store cutoffs.
- **Tauri/Rust** and OS WebView changes: smoke-test desktop builds each release.
- Re-verify microphone/permission flows after every OS major (they change often).
