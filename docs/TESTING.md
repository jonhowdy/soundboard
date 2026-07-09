# Testing strategy

A classic pyramid: many fast unit tests, a layer of integration tests around the
store, and a thin end-to-end layer that drives the real browser.

## Tooling
- **Vitest** (jsdom) — unit + integration, `npm test`.
- **@testing-library/react** — component tests (render, query by role/label).
- **Playwright** — e2e against the production preview, `npm run e2e`.

## What's covered today (`src/test`, 34 tests, all green)

| Suite | Layer | Verifies |
|-------|-------|----------|
| `audioFiles.test.ts` | unit | Format mapping, extension detection, title prettifier, data-URL round-trip |
| `synth.test.ts` | unit | Every seed effect emits a valid mono 16-bit PCM WAV (RIFF/WAVE header, size math) |
| `audioEngine.test.ts` | unit | `computeWaveform` bucket count, normalization, silence (no divide-by-zero) |
| `edit.test.ts` | unit | trim (clamp/order/non-empty), normalize (peak + silence), fades, reverse, duration/peak |
| `suggest.test.ts` | unit | Keyword→emoji/color/tags, fallback, stop-word filtering; multi-channel WAV encoder header/size |
| `hotkeys.test.ts` | unit | Combo serialization (single keys, Space, modifier order, bare modifiers) |
| `globalHotkeys.test.ts` | unit | Desktop accelerator conversion (modifier mapping, F-keys, Space, null when no key) |
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

## End-to-end (Playwright)
A smoke flow already validated manually during the build:
load → 12 buttons render → click plays → mixer appears → open settings → search
filters → **zero console errors**. Formalize as `e2e/board.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('play, filter and configure the board', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('button[aria-label^="Play"]');
  const buttons = page.locator('button[aria-label^="Play"]');
  expect(await buttons.count()).toBeGreaterThan(0);
  await buttons.first().click();
  await expect(page.getByText(/playing/)).toBeVisible();     // mixer
  await page.fill('input[aria-label="Search sounds"]', 'horn');
  await expect(buttons).toHaveCount(1);
});
```

> Note: this environment's pre-installed Chromium lives at
> `/opt/pw-browsers/chromium`; set `executablePath` (or
> `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`) rather than running `playwright install`.

## CI gate
`.github/workflows/ci.yml` runs **typecheck → unit/integration tests → production
build** on every push/PR and uploads the web build. Add the Playwright job once
`e2e/` exists. A PR must be green to merge.
