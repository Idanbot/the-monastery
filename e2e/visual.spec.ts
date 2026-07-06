import { expect, test } from '@playwright/test';
import {
  chooseTheme,
  completeBreathingIntro,
  createTask,
  installStableVisualState,
  openSettingsSection,
  resetServerState,
  stabilizePage
} from './helpers';

const screenshotOptions = { animations: 'disabled' as const, caret: 'hide' as const, timeout: 10_000 };

test.beforeEach(async ({ page, request }) => {
  await installStableVisualState(page);
  const activeProfileId = await resetServerState(request, {
    profilePrefix: 'Visual',
    animationsEnabled: false
  });
  await page.addInitScript((profileId) => {
    localStorage.clear();
    localStorage.setItem('the-monastery_active_profile_id_v1', profileId);
  }, activeProfileId);
});

test('theme gallery remains visually stable', async ({ page }) => {
  await page.goto('/');
  await stabilizePage(page);
  await openSettingsSection(page, 'Appearance');
  await expect(page.getByTestId('theme-gallery')).toHaveScreenshot('theme-gallery.png', screenshotOptions);
});

test('compact desktop header remains visually stable', async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 900 });
  await page.goto('/');
  await stabilizePage(page);
  await expect(page.locator('.app-header')).toHaveScreenshot('compact-header.png', screenshotOptions);
});

test('settings modal and Liquid Glass settings remain visually stable', async ({ page }) => {
  await page.goto('/');
  await stabilizePage(page);
  await openSettingsSection(page, 'Appearance');
  await expect(page.getByRole('dialog', { name: /preferences/i })).toHaveScreenshot(
    'settings-modal.png',
    screenshotOptions
  );
  await chooseTheme(page, 'liquid-glass');
  await expect(page.getByRole('dialog', { name: /preferences/i })).toHaveScreenshot(
    'settings-liquid-glass.png',
    { ...screenshotOptions, maxDiffPixels: 100 }
  );
});

test('monk mode focus surface remains visually stable', async ({ page }) => {
  await page.goto('/');
  await stabilizePage(page);
  await createTask(page, 'Visual focus task');
  await page.getByText('Visual focus task').first().click();
  await page.getByLabel('Status').selectOption('in-progress');
  await page.getByRole('button', { name: /save task/i }).click();
  await page.keyboard.press('m');
  await completeBreathingIntro(page);
  await expect(page.getByTestId('monk-mode-view')).toHaveScreenshot('monk-mode.png', {
    ...screenshotOptions,
    maxDiffPixels: 80
  });
});

test('mobile task board remains visually stable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await stabilizePage(page);
  await createTask(page, 'Mobile visual task');
  await expect(page.locator('.app-main')).toHaveScreenshot('mobile-board.png', {
    ...screenshotOptions,
    maxDiffPixels: 1000
  });
});

test('collapsed full-layout lanes remain visually stable', async ({ page }) => {
  await page.goto('/');
  await stabilizePage(page);
  await createTask(page, 'Collapsed lane task');
  await openSettingsSection(page, 'Board');
  await page.getByLabel('Board layout', { exact: true }).selectOption('full');
  await page.getByRole('checkbox', { name: 'Collapse Backlog lane' }).check();
  await page.getByRole('checkbox', { name: 'Collapse Done lane' }).check();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('kanban-board')).toHaveScreenshot('collapsed-columns.png', {
    ...screenshotOptions,
    maxDiffPixels: 120
  });
});

test('keyboard task movement remains visually stable', async ({ page }) => {
  await page.goto('/');
  await stabilizePage(page);
  await createTask(page, 'Keyboard movement task');
  const card = page.getByLabel(/Keyboard movement task, Backlog/i);
  await card.focus();
  await page.keyboard.press('Alt+ArrowRight');
  await expect(page.getByTestId('board-column-in-progress')).toContainText('Keyboard movement task');
  await expect(page.getByTestId('kanban-board')).toHaveScreenshot('keyboard-task-movement.png', {
    ...screenshotOptions,
    maxDiffPixels: 120
  });
});

test('expanded mobile board controls remain visually stable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await stabilizePage(page);
  const controls = page.getByTestId('mobile-board-controls');
  await controls.getByText('Board layout').click();
  await controls.getByRole('button', { name: /customize lane order/i }).click();
  await expect(controls).toHaveScreenshot('mobile-board-controls.png', screenshotOptions);
});
