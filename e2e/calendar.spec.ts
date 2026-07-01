import { expect, test } from '@playwright/test';
import { browserToday, createTask, openSettingsSection, resetServerState } from './helpers';

test.beforeEach(async ({ page, request }) => {
  const activeProfileId = await resetServerState(request);
  await page.addInitScript((profileId) => {
    localStorage.clear();
    localStorage.setItem('the-monastery_active_profile_id_v1', profileId);
  }, activeProfileId);
});

test('navigates to calendar view and shows layout elements', async ({ page }) => {
  await page.goto('/');

  // Navigate to Calendar View
  await page.getByTestId('view-switch-calendar').click();
  await expect(page.getByTestId('calendar-view')).toBeVisible();
  await expect(page.getByTestId('app-sidebar')).toHaveCount(0);

  // Header and switchers
  await expect(page.getByTestId('calendar-header-title')).toBeVisible();
  await expect(page.getByRole('button', { name: /^day$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^week$/i })).toBeVisible();

  // Side ruler and Unscheduled sidebar
  await expect(page.getByTestId('calendar-view').getByText('00:00')).toBeVisible();
  await expect(page.getByTestId('calendar-scroll-area')).toHaveJSProperty('scrollTop', 0);
  await expect(page.getByTestId('unscheduled-sidebar')).toBeVisible();
});

test('adds unscheduled task and schedules it by drag and drop', async ({ page }) => {
  const todayStr = await browserToday(page);
  const taskTitle = 'E2E Drag Schedule Task';

  await page.goto('/');

  // Create an unscheduled task
  await createTask(page, taskTitle);

  // Navigate to Calendar View
  await page.getByTestId('view-switch-calendar').click();
  await expect(page.getByTestId('calendar-view')).toBeVisible();

  // Assert task is in unscheduled sidebar
  const taskCard = page.getByTestId(`unscheduled-task-${taskTitle}`);
  await expect(taskCard).toBeVisible();

  // Drag task to 9:30 AM slot on today
  await taskCard.evaluate((source, targetSelector) => {
    const target = document.querySelector(targetSelector);
    if (!target) throw new Error(`Missing drop target ${targetSelector}`);
    const dataTransfer = new DataTransfer();
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer }));
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));
  }, `[data-testid="time-slot-${todayStr}-09:30"]`);

  // Assert it is now rendered on the calendar grid and not in unscheduled sidebar
  await expect(page.getByTestId(`calendar-task-${taskTitle}`)).toBeVisible();
  await expect(taskCard).not.toBeVisible();
});

test('toggles day and week view modes', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('view-switch-calendar').click();
  await expect(page.getByTestId('calendar-view')).toBeVisible();

  const todayStr = await browserToday(page);

  // Default is day view
  await expect(page.getByTestId(`day-column-${todayStr}`)).toBeVisible();

  // Switch to week view
  await page.getByRole('button', { name: /^week$/i }).click();

  // Week view shows 7 columns (we check at least a few exist)
  await expect(page.getByTestId(/^day-column-/)).toHaveCount(7);

  // Switch back to day view
  await page.getByRole('button', { name: /^day$/i }).click();
  await expect(page.getByTestId(/^day-column-/)).toHaveCount(1);
});

test('limits the calendar grid to one 24-hour day', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('view-switch-calendar').click();

  const geometry = await page.getByTestId('calendar-scroll-area').evaluate((scrollArea) => {
    const lastSlot = scrollArea.querySelector<HTMLElement>('[data-time="23:30"]');
    const ruler = scrollArea.querySelector<HTMLElement>('[data-testid="calendar-time-ruler"]');
    if (!lastSlot || !ruler) throw new Error('Missing calendar geometry elements');
    return {
      scrollHeight: scrollArea.scrollHeight,
      lastSlotBottom: lastSlot.offsetTop + lastSlot.offsetHeight,
      rulerHeight: ruler.offsetHeight
    };
  });

  expect(geometry).toEqual({ scrollHeight: 1496, lastSlotBottom: 1440, rulerHeight: 1440 });
});

test('uses the clock format setting for calendar labels', async ({ page }) => {
  await page.goto('/');
  await openSettingsSection(page, 'Time');
  await page
    .getByRole('combobox')
    .filter({ has: page.locator('option[value="12h"]') })
    .selectOption('12h');
  await page.getByRole('button', { name: /close settings/i }).click();

  await page.getByTestId('view-switch-calendar').click();
  const calendar = page.getByTestId('calendar-view');
  await expect(calendar.getByText('1:00 PM', { exact: true })).toBeVisible();
  await expect(calendar.getByText('13:00')).toHaveCount(0);
  await expect(page.locator('[data-time="13:00"]')).toHaveAttribute('aria-label', /1:00 PM/);
});
