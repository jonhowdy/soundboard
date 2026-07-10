# Testing strategy

A classic pyramid: many fast unit tests, a layer of integration tests around the
store, and an end-to-end layer that drives the real browser. **52 unit/integration
tests (Vitest) + 12 end-to-end tests (Playwright), all green.**

## Tooling
- **Vitest** (jsdom) — unit + integration, `npm test`.
- **@testing-library/react** — component tests (render, query by role/label).
- **Playwright** — e2e against the production preview, `npm run e2e`.

## What's covered today (`src/test`, 52 tests, all green)

| Suite | Layer | Verifies |
|-------|-------|----------|
| `audioFiles.test.ts` | unit | Format mapping, extension detection, title prettifier, data-URL round-trip |
| `synth.test.ts` | unit | Every seed effect emits a valid mono 16-bit PCM WAV (RIFF/WAVE header, size math) |
| `audioEngine.test.ts` | unit | `computeWaveform` bucket count, normalization, silence (no divide-by-zero) |
| `edit.test.ts` | unit | trim (clamp/order/non-empty), normalize (peak + silence), fades, reverse, duration/peak |
| `suggest.test.ts` | unit | Keyword→emoji/color/tags, fallback, stop-word filtering; multi-channel WAV encoder header/size |
| `hotkeys.test.ts` | unit | Combo serialization (single keys, Space, modifier order, bare modifiers) |
| `globalHotkeys.test.ts` | unit | Desktop accelerator conversion (modifier mapping, F-keys, Space, null when no key) |
| `queue.test.ts` | unit + integration | `moveItem`/`chunk` pure helpers; store queue reducers (add/reorder/remove/clear, duplicates) |
| `packs.test.ts` | unit | Catalog integrity (unique ids, real synth keys, required fields) + valid WAV render for every pack sound |
| `backup.test.ts` | unit | ZIP round-trip (manifest + audio), CSV header/escaping, backup pruning (auto cap, manual retention) |
| `store.filter.test.ts` | integration | `visibleSounds` search across title/tag/category, category & favorites filters, sort, favorite pinning |

Run: `npm test` · watch: `npm run test:watch` · UI: `npm run test:ui`.

## Testing philosophy
- **Pure logic is `static`/free-standing** (`computeWaveform`, `comboFromEvent`,
  file helpers) so it tests without a DOM or AudioContext.
- **Store actions are integration-tested** by seeding state with
  `useStore.setState` and asserting on derived output — no mocks needed for
  filtering/sorting.
- **Side-effecting boundaries** (IndexedDB, AudioContext, MediaRecorder) are
  mocked or exercised in e2e, not unit tests.

## Recommended next tests (as milestones land)
- **Component tests**: `SoundButton` fires `playSound` on click and
  `toggleFavorite` on the star; `SoundEditor` FX sliders patch `playback`;
  `Modal` closes on Esc/backdrop.
- **Store side-effects**: fake-IndexedDB (`fake-indexeddb`) to test
  `importFiles`, `deleteSound` (blob cleanup), `exportBackup`/`importBackup`
  round-trip, seed-once flag.
- **Audio engine with a mocked AudioContext**: assert graph wiring, fade ramps
  scheduled, `stopAll` disconnects, reversed-buffer caching.

## End-to-end (Playwright) — `e2e/`, 12 tests, all green

Run against a production build served by `vite preview` (config in
`playwright.config.ts`, `npm run e2e`). Every major user flow is covered:

| Spec | Flow verified |
|------|---------------|
| `board.spec.ts` | Seeds 12 sounds; play → live mixer; search filter; favorites filter; category filter |
| `pagination.spec.ts` | 2×2 → 3 pages; Next + page-dot navigation; `1/3` → `3/3` |
| `queue.spec.ts` | Add 3 from picker; remove; **play-all auto-advances back to idle**; clear |
| `packs.spec.ts` | Install a pack (library 12 → 18); "Installed" badge; remove reverts |
| `backup.spec.ts` | Auto-daily backup present on load; manual backup adds a version; CSV **download**; restore |
| `editor.spec.ts` | Right-click → editor; AI auto-style; **trim & apply**; theme switch updates `data-theme` |

Playwright uses web-first (auto-retrying) assertions, and each test runs in a
fresh browser context so IndexedDB starts empty and the board re-seeds
deterministically.

> Browser binary: locally the config points `executablePath` at the preinstalled
> `/opt/pw-browsers/chromium`; in CI `npx playwright install chromium` provides
> it and the override is skipped (the config detects this automatically).

## CI gate
`.github/workflows/ci.yml` runs three jobs on every push/PR:
1. **build-and-test** — typecheck → unit/integration (Vitest) → production build → upload web build.
2. **e2e** — install Chromium → Playwright suite → upload the HTML report.
3. **desktop** — install WebKitGTK deps → `cargo build` the Tauri app.

A PR must be green to merge.
