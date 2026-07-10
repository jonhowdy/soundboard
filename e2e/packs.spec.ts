import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

test.describe('sound packs', () => {
  test('installs and removes a pack', async ({ page }) => {
    await gotoApp(page);
    await page.getByTitle('Sound packs').click();
    const dialog = page.getByRole('dialog', { name: 'Sound packs' });
    await expect(dialog).toBeVisible();

    const installButtons = dialog.getByRole('button', { name: /Install/ });
    await expect(installButtons).toHaveCount(5);

    // Install the first pack (Retro Arcade → 6 sounds).
    await installButtons.first().click();
    await expect(dialog.getByText('Installed').first()).toBeVisible();

    // The "All" category chip count grows from 12 to 18.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /All.*18/ })).toBeVisible();

    // Reopen and remove it again.
    await page.getByTitle('Sound packs').click();
    await dialog.getByRole('button', { name: 'Remove' }).first().click();
    await expect(dialog.getByRole('button', { name: /Install/ }).first()).toBeVisible();
  });
});
