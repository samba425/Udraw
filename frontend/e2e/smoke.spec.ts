import { test, expect } from '@playwright/test';

/**
 * End-to-end smoke tests for the core editor flows. Boots the production
 * preview build (see `playwright.config.ts`) and drives the real UI.
 */

test.describe('DiagramForge editor', () => {
  test('loads the editor shell', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('toolbar', { name: 'Editor toolbar' })).toBeVisible();
    await expect(page.getByRole('application', { name: 'Diagram canvas' })).toBeVisible();
  });

  test('draws a rectangle on the canvas', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Rectangle (R)' }).click();

    const canvas = page.getByRole('application', { name: 'Diagram canvas' });
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    // Drag out a rectangle near the center of the canvas.
    await page.mouse.move(box.x + 200, box.y + 160);
    await page.mouse.down();
    await page.mouse.move(box.x + 340, box.y + 260, { steps: 8 });
    await page.mouse.up();

    // A new shape should exist inside the world-space group.
    await expect(canvas.locator('rect')).not.toHaveCount(0);
  });

  test('opens the AI generator dialog', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Generate with AI' }).click();
    const dialog = page.getByRole('dialog', { name: 'Generate diagram with AI' });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Diagram description').fill('Plan -> Build -> Ship');
    await dialog.getByRole('button', { name: 'Generate' }).click();

    // Dialog closes and shapes are rendered.
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole('application', { name: 'Diagram canvas' }).locator('text=Plan'),
    ).toBeVisible();
  });
});
