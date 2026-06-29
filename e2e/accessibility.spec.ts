import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { createTask, openSettingsSection, resetServerState } from './helpers';

test.beforeEach(async ({ page, request }) => {
  const profileId = await resetServerState(request, { profilePrefix: 'Accessibility' });
  await page.addInitScript((activeProfileId) => {
    localStorage.clear();
    localStorage.setItem('the-monastery_active_profile_id_v1', activeProfileId);
  }, profileId);
});

const expectNoSeriousViolations = async (page) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .disableRules(['color-contrast'])
    .analyze();
  const serious = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical'
  );
  expect(serious, serious.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([]);
};

test('board and keyboard movement controls pass accessibility checks', async ({ page }) => {
  await page.goto('/');
  await createTask(page, 'Accessible board task');
  await expect(page.getByLabel(/Accessible board task, Backlog/i)).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('settings dialog passes accessibility checks', async ({ page }) => {
  await page.goto('/');
  await openSettingsSection(page, 'Board');
  await expectNoSeriousViolations(page);
});

test('mobile controls pass accessibility checks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByTestId('mobile-board-controls').getByText('Board layout').click();
  await expectNoSeriousViolations(page);
});
