import { expect } from '@playwright/test';
import { mergeSettings } from '../src/domain/tasks';

export const api = (path: string) => 'http://127.0.0.1:3100' + path;

export const expectStatus = async (response, expectedStatus: number) => {
  if (response.status() !== expectedStatus) {
    throw new Error(response.url() + ' ' + response.status() + ': ' + (await response.text()));
  }
};

export const resetServerState = async (
  request,
  options: { profilePrefix?: string; animationsEnabled?: boolean } = {}
) => {
  const createdResponse = await request.post(api('/api/profiles'), {
    data: { name: (options.profilePrefix || 'E2E') + ' ' + Date.now() }
  });
  await expectStatus(createdResponse, 201);
  const created = await createdResponse.json();
  const activeProfile = created.profile;

  if (activeProfile) {
    await request.post(api('/api/profiles/' + activeProfile.id + '/reset'));
    const settings = mergeSettings({
      theme: 'system',
      visualTheme: 'zen',
      monkMode: false,
      animationsEnabled: options.animationsEnabled ?? true,
      textSize: 'medium',
      clockFormat: '24h',
      showSeconds: false,
      layoutPreset: 'compact',
      collapseTasks: false,
      sidebarWidgets: ['now', 'clock', 'agenda'],
      sidebarVisible: true,
      sidebarWidth: 320,
      clockHeight: 160,
      clockTextScale: 1,
      modalTransparency: 88,
      roles: []
    });
    const settingsResponse = await request.put(api('/api/profiles/' + activeProfile.id + '/settings'), {
      data: {
        settings
      }
    });
    await expectStatus(settingsResponse, 200);
  }

  return activeProfile.id;
};

export const createTask = async (page, title: string) => {
  await page
    .locator('button[aria-label="Backlog task"]:visible, button[aria-label="Create task"]:visible')
    .click();
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: /save task/i }).click();
};

export const createScheduledTask = async (page, title: string, date: string, start: string, end = '') => {
  await page
    .locator('button[aria-label="Backlog task"]:visible, button[aria-label="Create task"]:visible')
    .click();
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Date', { exact: true }).fill(date);
  await page.getByLabel('Start', { exact: true }).fill(start);
  if (end) await page.getByLabel('End', { exact: true }).fill(end);
  await page.getByRole('button', { name: /save task/i }).click();
};

export const openSettingsSection = async (page, sectionName: string | RegExp) => {
  const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
  if (isMobile) {
    await page.getByTestId('mobile-shell').getByRole('button', { name: 'More' }).click();
    await page.getByRole('dialog', { name: 'More' }).getByRole('button', { name: 'Settings' }).click();
  } else {
    await page.getByRole('button', { name: /open settings/i }).click();
  }
  await page.getByRole('button', { name: sectionName }).click();
};

export const chooseTheme = async (page, themeId: string) => {
  await page.locator('[data-theme-card="' + themeId + '"]').click();
};

export const searchTasks = async (page, query: string) => {
  await page.getByRole('textbox', { name: /search tasks, notes, roles, and projects/i }).fill(query);
};

export const browserToday = async (page) =>
  page.evaluate(() => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return today.getFullYear() + '-' + month + '-' + day;
  });

export const expectTaskVisible = async (page, title: string) => {
  await expect(page.getByText(title).first()).toBeVisible();
};

export const completeBreathingIntro = async (page) => {
  const skipIntro = page.getByRole('button', { name: /skip breathing intro/i });
  await skipIntro
    .first()
    .waitFor({ state: 'visible', timeout: 2000 })
    .catch(() => {});
  if ((await skipIntro.count()) > 0 && (await skipIntro.first().isVisible())) {
    await skipIntro.first().click();
  }
};

export const installStableVisualState = async (page) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
};

export const stabilizePage = async (page) => {
  await page.addStyleTag({
    content:
      '* { caret-color: transparent !important; } .sonner-toast, [data-sonner-toaster] { display: none !important; }'
  });
};
