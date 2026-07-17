import { expect, test } from './fixtures';
import {
  browserToday,
  chooseTheme,
  completeBreathingIntro,
  createScheduledTask,
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
    profileName: 'Visual workspace',
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
  await expect(page.getByTestId('theme-gallery-group-light')).toHaveScreenshot(
    'theme-gallery-light.png',
    screenshotOptions
  );
  await page.getByRole('button', { name: 'Dark Themes' }).click();
  const firstDarkTheme = page
    .getByTestId('theme-gallery-group-dark')
    .getByTestId('theme-gallery-card')
    .first();
  await expect(firstDarkTheme).toHaveScreenshot('theme-gallery-dark.png', screenshotOptions);
});

test('compact desktop header remains visually stable', async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 900 });
  await page.goto('/');
  await stabilizePage(page);
  await expect(page.locator('.app-header')).toHaveScreenshot('compact-header.png', {
    ...screenshotOptions,
    maxDiffPixels: 100
  });
});

test('customizable main workspace remains visually stable', async ({ page }) => {
  await page.goto('/');
  await stabilizePage(page);
  await expect(page.getByTestId('main-workspace')).toHaveScreenshot('main-workspace.png', {
    ...screenshotOptions,
    maxDiffPixels: 200
  });
});

test('Kanban modal remains readable and visually stable', async ({ page }) => {
  await page.goto('/');
  await stabilizePage(page);
  await page.getByRole('button', { name: 'Open Kanban' }).click();
  await expect(page.getByRole('dialog', { name: 'Kanban board' })).toHaveScreenshot('kanban-modal.png', {
    ...screenshotOptions,
    maxDiffPixels: 200
  });
});

test('settings modal and Liquid Glass settings remain visually stable', async ({ page }) => {
  await page.goto('/');
  await stabilizePage(page);
  await openSettingsSection(page, 'Appearance');
  await expect(page.getByRole('dialog', { name: /preferences/i })).toHaveScreenshot('settings-modal.png', {
    ...screenshotOptions,
    maxDiffPixels: 2000
  });
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

test('mobile Today view remains visually stable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await stabilizePage(page);
  await createTask(page, 'Review the migration plan');
  await page.getByText('Review the migration plan').first().click();
  await page.getByLabel('Status').selectOption('in-progress');
  await page.getByRole('button', { name: /save task/i }).click();
  await page.getByTestId('mobile-shell').getByRole('button', { name: 'Today' }).click();
  await expect(page.locator('.app-main')).toHaveScreenshot('mobile-today.png', screenshotOptions);
});

test('mobile calendar agenda remains visually stable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await stabilizePage(page);
  await createScheduledTask(page, 'Architecture review', await browserToday(page), '09:30', '10:30');
  await page.getByTestId('mobile-shell').getByRole('button', { name: 'Calendar' }).click();
  await expect(page.locator('.app-main')).toHaveScreenshot('mobile-calendar.png', screenshotOptions);
});

test('mobile analytics summary remains visually stable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await stabilizePage(page);
  await createTask(page, 'Analytics visual task');
  await page.getByTestId('mobile-shell').getByRole('button', { name: 'More' }).click();
  await page.getByRole('dialog', { name: 'More' }).getByRole('button', { name: 'Analytics' }).click();
  await expect(page.locator('.app-main')).toHaveScreenshot('mobile-analytics.png', screenshotOptions);
});

test('mobile projects view remains visually stable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await stabilizePage(page);
  await page.getByTestId('mobile-shell').getByRole('button', { name: 'More' }).click();
  await page.getByRole('dialog', { name: 'More' }).getByRole('button', { name: 'Projects' }).click();
  await expect(page.getByTestId('projects-view')).toBeVisible();
  await expect(page.locator('.app-main')).toHaveScreenshot('mobile-projects.png', screenshotOptions);
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

test('mobile lane tabs remain visually stable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await stabilizePage(page);
  await createTask(page, 'Lane tab visual task');
  await expect(page.getByTestId('mobile-lane-tabs')).toHaveScreenshot(
    'mobile-lane-tabs.png',
    screenshotOptions
  );
});
