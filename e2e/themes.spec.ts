import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

test.describe('custom themes', () => {
  test('create a custom theme, apply it, and see it in the picker', async ({ page }) => {
    await gotoApp(page);
    await page.getByTitle('Settings').click();

    await page.getByRole('button', { name: /Create/ }).click();
    const editor = page.getByRole('dialog', { name: 'Create theme' });
    await expect(editor).toBeVisible();

    await editor.getByLabel('Name').fill('E2E Sunrise');

    // Set the accent color robustly (native color inputs don't accept fill()).
    await editor
      .getByLabel('Accent', { exact: true })
      .evaluate((el, v) => {
        (el as HTMLInputElement).value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, '#ff8800');

    await editor.getByRole('button', { name: /Create & apply/ }).click();

    // The new theme becomes active…
    await expect(page.locator('html')).toHaveAttribute('data-theme', /^custom-/);
    // …and shows up as a swatch in the picker.
    await expect(page.getByText('E2E Sunrise')).toBeVisible();
  });
});

test.describe('accessibility settings', () => {
  test('large-text mode survives a reload', async ({ page }) => {
    await gotoApp(page);
    await page.getByTitle('Settings').click();
    await page.getByRole('switch', { name: 'Large text' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-large-text', '');

    // Settings persist asynchronously; wait for the IndexedDB write to land
    // before reloading, otherwise the reload can race the commit.
    await page.waitForFunction(
      () =>
        new Promise<boolean>((resolve) => {
          const req = indexedDB.open('soundboard');
          req.onsuccess = () => {
            const db = req.result;
            try {
              const get = db
                .transaction('meta', 'readonly')
                .objectStore('meta')
                .get('settings');
              get.onsuccess = () => {
                const val = get.result as { largeText?: boolean } | undefined;
                db.close();
                resolve(Boolean(val?.largeText));
              };
              get.onerror = () => {
                db.close();
                resolve(false);
              };
            } catch {
              db.close();
              resolve(false);
            }
          };
          req.onerror = () => resolve(false);
        }),
    );

    // The persisted setting must be re-applied on a fresh load.
    await page.reload();
    await expect(page.locator('button[aria-label^="Play"]').first()).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-large-text', '');
  });
});
