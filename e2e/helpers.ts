import { expect } from '@playwright/test';

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
    const settingsResponse = await request.put(api('/api/profiles/' + activeProfile.id + '/settings'), {
      data: {
        settings: {
          theme: 'system',
          visualTheme: 'zen',
          colorScheme: { main: '', secondary: '', text: '' },
          fontMain: '',
          fontSecondary: '',
          fontUI: '',
          customThemeName: '',
          monkMode: false,
          dailyGoal: '',
          shutdownChecklist: {},
          sidebarVisible: true,
          animationsEnabled: options.animationsEnabled ?? true,
          clockFormat: '24h',
          showSeconds: false,
          sidebarWidgets: ['now', 'clock', 'agenda'],
          sidebarWidth: 320,
          clockHeight: 160,
          clockTextScale: 1,
          clockBackgroundVisible: true,
          clockTextColor: '',
          clockBackgroundColor: '',
          clockDisplayMode: 'digital',
          modalTransparency: 88,
          modalBlur: 1,
          layoutPreset: 'compact',
          textSize: 'medium',
          roles: [],
          tagGoals: [],
          collapseTasks: false,
          autoPromoteNextTask: false,
          resizeHandleVisible: true,
          resizeHandleThickness: 4,
          resizeHandleLength: 48,
          resizeHandleColor: '#94a3b8',
          timelineHourLinesVisible: true,
          timelineNowLineVisible: true,
          columnWidths: { backlog: 25, inProgress: 25, done: 25, rejected: 25 },
          compactColumnWidths: { left: 50, right: 50 },
          compactHeights: { backlog: 50, inProgress: 50, done: 50, rejected: 50 },
          boardColumnOrder: {
            compactActive: ['in-progress', 'backlog'],
            compactDone: ['done', 'rejected'],
            threeColumn: ['in-progress', 'backlog', 'done', 'rejected'],
            full: ['backlog', 'in-progress', 'done', 'rejected']
          }
        }
      }
    });
    await expectStatus(settingsResponse, 200);
  }

  return activeProfile.id;
};

export const createTask = async (page, title: string) => {
  await page.getByLabel('Backlog task').click();
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: /save task/i }).click();
};

export const createScheduledTask = async (page, title: string, date: string, start: string, end = '') => {
  await page.getByLabel('Backlog task').click();
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Date').fill(date);
  await page.getByLabel('Start').fill(start);
  if (end) await page.getByLabel('End').fill(end);
  await page.getByRole('button', { name: /save task/i }).click();
};

export const openSettingsSection = async (page, sectionName: string | RegExp) => {
  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: sectionName }).click();
};

export const chooseTheme = async (page, themeId: string) => {
  await page.locator('[data-theme-card="' + themeId + '"]').click();
};

export const searchTasks = async (page, query: string) => {
  await page.locator('input[placeholder="Search tasks"]:visible').fill(query);
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
