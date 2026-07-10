import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

test.describe('queue mode', () => {
  test('builds, edits and plays a queue', async ({ page }) => {
    await gotoApp(page);
    await page.getByTitle('Queue').click();
    const dialog = page.getByRole('dialog', { name: 'Queue' });
    await expect(dialog).toBeVisible();

    // Add three sounds from the in-modal picker.
    const addList = dialog.locator('h3:has-text("Add sounds") + input + ul');
    const adders = addList.locator('li button');
    for (let i = 0; i < 3; i++) await adders.nth(i).click();
    await expect(dialog.getByText('In queue (3)')).toBeVisible();

    // Remove one → two left.
    await dialog.getByRole('button', { name: 'Remove from queue' }).first().click();
    await expect(dialog.getByText('In queue (2)')).toBeVisible();

    // Play the queue; it auto-advances and returns to idle when done.
    await dialog.getByRole('button', { name: 'Play all' }).click();
    await expect(dialog.getByRole('button', { name: 'Play all' })).toBeVisible({
      timeout: 15_000,
    });

    // Clear empties the queue.
    await dialog.getByRole('button', { name: 'Clear' }).click();
    await expect(dialog.getByText('In queue (0)')).toBeVisible();
  });
});
