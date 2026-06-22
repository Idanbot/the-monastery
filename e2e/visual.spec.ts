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

const screenshotOptions = { animations: 'disabled' as const, caret: 'hide' as const };

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
    screenshotOptions
  );
});

test('monk mode focus surface remains visually stable', async ({ page }) => {
  await page.goto('/');
  await stabilizePage(page);
  await createTask(page, 'Visual focus task');
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
  await expect(page.locator('.app-main')).toHaveScreenshot('mobile-board.png', screenshotOptions);
});
