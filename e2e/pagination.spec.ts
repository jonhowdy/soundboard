import { test, expect } from '@playwright/test';
import { gotoApp, playButtons } from './helpers';

test.describe('multi-page board', () => {
  test('paginates and navigates between pages', async ({ page }) => {
    await gotoApp(page);

    // 2×2 → 4 per page → 12 sounds span 3 pages.
    await page.getByRole('button', { name: '2×2' }).click();
    const nav = page.getByRole('navigation', { name: 'Board pages' });
    await expect(nav).toBeVisible();
    await expect(playButtons(page)).toHaveCount(4);

    await expect(nav.getByText('1/3')).toBeVisible();
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(nav.getByText('2/3')).toBeVisible();

    // Jump to the last page via its dot.
    await nav.getByRole('button', { name: 'Page 3' }).click();
    await expect(nav.getByText('3/3')).toBeVisible();
  });
});
