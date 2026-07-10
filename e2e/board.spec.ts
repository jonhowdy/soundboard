import { test, expect } from '@playwright/test';
import { gotoApp, playButtons } from './helpers';

test.describe('board', () => {
  test('seeds a playable library', async ({ page }) => {
    await gotoApp(page);
    await expect(playButtons(page)).toHaveCount(12);
  });

  test('playing a sound shows the live mixer', async ({ page }) => {
    await gotoApp(page);
    await playButtons(page).first().click();
    await expect(page.getByText(/playing/)).toBeVisible();
  });

  test('search filters by name', async ({ page }) => {
    await gotoApp(page);
    await page.getByLabel('Search sounds').fill('horn');
    await expect(playButtons(page)).toHaveCount(1);
    await page.getByLabel('Search sounds').fill('');
    await expect(playButtons(page)).toHaveCount(12);
  });

  test('favorites filter shows only starred sounds', async ({ page }) => {
    await gotoApp(page);
    // The seed marks three sounds as favorites.
    await page.getByTitle('Favorites only').click();
    await expect(playButtons(page)).toHaveCount(3);
  });

  test('category chip filters the board', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: /Gaming/ }).click();
    await expect(playButtons(page)).toHaveCount(2);
  });
});
