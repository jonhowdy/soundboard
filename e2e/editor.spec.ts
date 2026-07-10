import { test, expect } from '@playwright/test';
import { gotoApp, playButtons } from './helpers';

test.describe('sound editor', () => {
  test('opens via right-click, auto-styles and trims audio', async ({ page }) => {
    await gotoApp(page);
    await playButtons(page).first().click({ button: 'right' });

    const editor = page.getByRole('dialog', { name: 'Edit sound' });
    await expect(editor).toBeVisible();

    // AI auto-style applies emoji/color/tags without error.
    await editor.getByRole('button', { name: /Auto-style/ }).click();

    // Open the waveform editor, wait for decode, apply the edit.
    await editor.getByRole('button', { name: /Trim & edit/ }).click();
    const trim = page.getByRole('dialog', { name: 'Trim & edit audio' });
    await expect(trim).toBeVisible();
    await expect(trim.getByText('Decoding audio…')).toHaveCount(0, { timeout: 10_000 });

    await trim.getByLabel('Trim end').fill('0.6');
    await trim.getByRole('button', { name: /Apply edit/ }).click();

    // Applying closes the trim modal and returns to the editor.
    await expect(trim).toBeHidden();
    await expect(editor).toBeVisible();
  });
});

test.describe('themes', () => {
  test('switching theme updates the document', async ({ page }) => {
    await gotoApp(page);
    await page.getByTitle('Settings').click();
    await page.getByRole('button', { name: 'Light', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});
