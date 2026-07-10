import { type Page, expect } from '@playwright/test';

/** Navigate to the app and wait for the seeded board to render. */
export async function gotoApp(page: Page): Promise<void> {
  await page.goto('/');
  // The board seeds 12 synthesized sounds on first run.
  await expect(page.locator('button[aria-label^="Play"]').first()).toBeVisible();
}

export const playButtons = (page: Page) =>
  page.locator('button[aria-label^="Play"]');
