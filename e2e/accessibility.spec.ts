import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';
import {
  browserToday,
  createScheduledTask,
  createTask,
  openSettingsSection,
  resetServerState
} from './helpers';

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
  await expect(page.getByTestId('mobile-lane-tabs')).toBeVisible();
  await expectNoSeriousViolations(page);

  const shell = page.getByTestId('mobile-shell');
  await shell.getByRole('button', { name: 'Today' }).click();
  await expect(page.getByTestId('mobile-focus-view')).toBeVisible();
  await expectNoSeriousViolations(page);

  await shell.getByRole('button', { name: 'Calendar' }).click();
  await expect(page.getByTestId('mobile-calendar-agenda')).toBeVisible();
  await expectNoSeriousViolations(page);

  await shell.getByRole('button', { name: 'More' }).click();
  await page.getByRole('dialog', { name: 'More' }).getByRole('button', { name: 'Analytics' }).click();
  await expect(page.getByTestId('mobile-analytics-view')).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('calendar supports keyboard navigation, descriptive events, and contrast checks', async ({ page }) => {
  const today = await browserToday(page);
  await page.goto('/');
  await createScheduledTask(page, 'Accessible calendar event', today, '09:00', '10:00');
  await page.getByTestId('view-switch-calendar').click();

  await expect(
    page.getByRole('button', {
      name: `Accessible calendar event, ${today} from 09:00 to 10:00`
    })
  ).toBeVisible();

  const midnight = page.getByRole('button', { name: `${today} at 00:00, create task` });
  await midnight.focus();
  await page.keyboard.press('ArrowDown');
  const halfPast = page.getByRole('button', { name: `${today} at 00:30, create task` });
  await expect(halfPast).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: /task details/i })).toBeVisible();
  await expect(page.getByLabel('Start')).toHaveValue('00:30');
  await page.getByRole('button', { name: /close task details/i }).click();

  const results = await new AxeBuilder({ page })
    .include('[data-testid="calendar-view"]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  const serious = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical'
  );
  expect(serious, serious.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([]);
});
