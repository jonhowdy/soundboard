import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

test.describe('backup & restore', () => {
  test('auto-backs up, allows manual backup and CSV export', async ({ page }) => {
    await gotoApp(page);
    await page.getByTitle('Settings').click();
    await page.getByRole('button', { name: /Backup & restore/ }).click();

    const dialog = page.getByRole('dialog', { name: 'Backup & restore' });
    await expect(dialog).toBeVisible();

    // A daily automatic backup is taken on first load.
    await expect(dialog.getByRole('heading', { name: /Version history \(1\)/ })).toBeVisible();

    // Manual backup adds a second version.
    await dialog.getByRole('button', { name: 'Back up now' }).click();
    await expect(dialog.getByRole('heading', { name: /Version history \(2\)/ })).toBeVisible();
    await expect(dialog.getByText('Manual')).toBeVisible();

    // CSV export triggers a download.
    const [csv] = await Promise.all([
      page.waitForEvent('download'),
      dialog.getByRole('button', { name: /CSV list/ }).click(),
    ]);
    expect(csv.suggestedFilename()).toMatch(/soundboard-.*\.csv/);
  });

  test('restores a backup', async ({ page }) => {
    await gotoApp(page);
    await page.getByTitle('Settings').click();
    await page.getByRole('button', { name: /Backup & restore/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Backup & restore' });

    // Restoring the existing auto backup should not error (accept the confirm).
    page.on('dialog', (d) => d.accept());
    await dialog.getByRole('button', { name: 'Restore' }).first().click();
    await expect(dialog).toBeVisible();
  });
});
