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
