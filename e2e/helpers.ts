import { expect } from '@playwright/test';
import { mergeSettings } from '../src/domain/tasks';

export const api = (path: string) =>
  (process.env.THE_MONASTERY_E2E_API_URL || 'http://127.0.0.1:3100') + path;

export const expectStatus = async (response, expectedStatus: number) => {
  if (response.status() !== expectedStatus) {
    throw new Error(response.url() + ' ' + response.status() + ': ' + (await response.text()));
  }
};

export const resetServerState = async (
  request,
  options: { profilePrefix?: string; profileName?: string; animationsEnabled?: boolean } = {}
) => {
  const createdResponse = await request.post(api('/api/profiles'), {
    data: { name: options.profileName || (options.profilePrefix || 'E2E') + ' ' + Date.now() }
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
      sidebarWidgets: ['now', 'clock', 'media', 'agenda'],
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

export const openBoard = async (page) => {
  if ((page.viewportSize()?.width ?? 1280) < 768) return;
  const boardButton = page.getByTestId('view-switch-board');
  await boardButton.waitFor({ state: 'visible' });
  await boardButton.click();
  await expect(page.getByTestId('kanban-board')).toBeVisible();
};

export const createTask = async (page, title: string) => {
  await openBoard(page);
  await page
    .locator('button[aria-label="Backlog task"]:visible, button[aria-label="Create task"]:visible')
    .click();
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: /save task/i }).click();
};

export const createScheduledTask = async (page, title: string, date: string, start: string, end = '') => {
  await openBoard(page);
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
  await page.getByTestId('settings-content').getByRole('button', { name: sectionName, exact: true }).click();
};

export const chooseSettingsOption = async (page, label: string | RegExp, option: string | RegExp) => {
  await page.getByRole('combobox', { name: label }).click();
  await page.getByRole('option', { name: option, exact: typeof option === 'string' }).click();
};

export const chooseTheme = async (page, themeId: string) => {
  const themeCard = page.locator('[data-theme-card="' + themeId + '"]');
  if ((await themeCard.count()) === 0) {
    const groupName = ['terminal', 'terminal-white'].includes(themeId)
      ? 'Terminal Themes'
      : ['zen', 'liquid-glass', 'github-light'].includes(themeId)
        ? 'Light Themes'
        : 'Dark Themes';
    const groupTrigger = page.getByRole('button', { name: groupName, exact: true });
    if ((await groupTrigger.getAttribute('aria-expanded')) === 'false') await groupTrigger.click();
  }
  await themeCard.click();
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
  await page.clock.setFixedTime(new Date('2026-07-14T09:41:00.000Z'));
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
