import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { resetServerState, stabilizePage } from './helpers';

test.beforeEach(async ({ page, request }) => {
  const profileId = await resetServerState(request, { profilePrefix: 'UI quality' });
  await page.addInitScript((activeProfileId) => {
    localStorage.clear();
    localStorage.setItem('the-monastery_active_profile_id_v1', activeProfileId);
  }, profileId);
});

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(
    () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
};

test('mobile shell keeps primary actions reachable and the More sheet anchored', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await stabilizePage(page);
  await expectNoHorizontalOverflow(page);

  const shell = page.getByTestId('mobile-shell');
  for (const button of await shell.getByRole('button').all()) {
    const box = await button.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  await shell.getByRole('button', { name: 'More' }).click();
  const sheet = page.getByRole('dialog', { name: 'More' });
  await expect(sheet).toHaveAttribute('data-presentation', 'bottom-sheet');
  const sheetBox = await sheet.boundingBox();
  expect(sheetBox?.width).toBeGreaterThanOrEqual(389);
  expect(Math.abs((sheetBox?.y || 0) + (sheetBox?.height || 0) - 844)).toBeLessThanOrEqual(1);
  await expectNoHorizontalOverflow(page);
});

test('1080px desktop toolbar remains one row without viewport overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 900 });
  await page.goto('/');
  await stabilizePage(page);

  const header = page.locator('.app-header');
  await expect(header).toHaveAttribute('data-layout', 'single-row');
  const headerBox = await header.boundingBox();
  const toolbarBox = await page.getByTestId('workspace-toolbar').boundingBox();
  expect(toolbarBox?.y).toBeGreaterThanOrEqual(headerBox?.y || 0);
  expect((toolbarBox?.y || 0) + (toolbarBox?.height || 0)).toBeLessThanOrEqual(
    (headerBox?.y || 0) + (headerBox?.height || 0) + 1
  );
  await expectNoHorizontalOverflow(page);
});

test('compact profile icon stays centered in its trigger', async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 900 });
  await page.goto('/');
  await stabilizePage(page);

  const triggerBox = await page.getByTestId('active-profile-control').boundingBox();
  const iconBox = await page.getByTestId('active-profile-icon').boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(iconBox).not.toBeNull();

  const triggerCenter = {
    x: triggerBox!.x + triggerBox!.width / 2,
    y: triggerBox!.y + triggerBox!.height / 2
  };
  const iconCenter = {
    x: iconBox!.x + iconBox!.width / 2,
    y: iconBox!.y + iconBox!.height / 2
  };
  expect(Math.abs(triggerCenter.x - iconCenter.x)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(triggerCenter.y - iconCenter.y)).toBeLessThanOrEqual(0.5);
});

test('accessibility display preferences preserve the workspace', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/');
  await stabilizePage(page);

  await expect(page.getByTestId('main-workspace')).toBeVisible();
  const motionDuration = await page
    .locator('.app-shell')
    .evaluate((element) => getComputedStyle(element).getPropertyValue('--motion-duration').trim());
  expect(motionDuration).toBe('0ms');
  await expectNoHorizontalOverflow(page);
});
