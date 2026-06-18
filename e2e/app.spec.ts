import { expect, test } from '@playwright/test';

const api = (path: string) => `http://127.0.0.1:3100${path}`;

const expectStatus = async (response, expectedStatus: number) => {
  if (response.status() !== expectedStatus) {
    throw new Error(`${response.url()} ${response.status()}: ${await response.text()}`);
  }
};

const resetServerState = async (request) => {
  const createdResponse = await request.post(api('/api/profiles'), {
    data: { name: `E2E ${Date.now()}` }
  });
  await expectStatus(createdResponse, 201);
  const created = await createdResponse.json();
  const activeProfile = created.profile;

  if (activeProfile) {
    await request.post(api(`/api/profiles/${activeProfile.id}/reset`));
    const settingsResponse = await request.put(api(`/api/profiles/${activeProfile.id}/settings`), {
      data: {
        settings: {
          theme: 'system',
          visualTheme: 'zen',
          monkMode: false,
          animationsEnabled: true,
          textSize: 'medium',
          clockFormat: '24h',
          showSeconds: false,
          layoutPreset: 'standard',
          collapseTasks: false,
          sidebarWidgets: ['now', 'clock', 'agenda'],
          sidebarVisible: true,
          sidebarWidth: 320,
          clockHeight: 160,
          clockTextScale: 1,
          modalTransparency: 88,
          roles: []
        }
      }
    });
    await expectStatus(settingsResponse, 200);
  }

  return activeProfile.id;
};

const createTask = async (page, title: string) => {
  await page.getByLabel('New task').click();
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: /save task/i }).click();
};

const searchTasks = async (page, query: string) => {
  await page.locator('input[placeholder="Search tasks"]:visible').fill(query);
};

const expectTaskVisible = async (page, title: string) => {
  await expect(page.getByText(title).first()).toBeVisible();
};

test.beforeEach(async ({ page, request }) => {
  const activeProfileId = await resetServerState(request);
  await page.addInitScript((profileId) => {
    localStorage.clear();
    localStorage.setItem('the-monastery_active_profile_id_v1', profileId);
  }, activeProfileId);
});

test('creates and finds a task in the browser app', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'TheMonastery' })).toBeVisible();
  await createTask(page, 'Browser sync smoke');

  await page.getByRole('button', { name: /list/i }).click();
  await searchTasks(page, 'browser sync');

  await expectTaskVisible(page, 'Browser sync smoke');
  await expect(page.getByText('Design Database Schema')).toHaveCount(0);
});

test('adds a task tag from the fuzzy tag pool', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('New task').click();
  await page.getByLabel('Title').fill('Pool tag smoke');
  await page.getByRole('textbox', { name: /find tag/i }).fill('py');
  await page.getByRole('button', { name: /^python$/i }).click();
  await page.getByRole('button', { name: /save task/i }).click();

  await page.getByRole('button', { name: /filters/i }).click();
  await page.getByRole('button', { name: /^python$/i }).click();
  await expectTaskVisible(page, 'Pool tag smoke');
});

test('opens settings and exposes backup/import controls', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /open settings/i }).click();

  await expect(page.getByRole('heading', { name: /preferences/i })).toBeVisible();
  await page.getByRole('button', { name: /^tasks data$/i }).click();
  await expect(page.getByRole('button', { name: /backup/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /import/i })).toBeVisible();
});

test('customizes clock, resize handles, and timeline guides from settings', async ({ page }) => {
  await page.goto('/');

  const clock = page.locator('.clock-widget');
  await expect(clock).toBeVisible();
  await expect(clock.locator('button')).toHaveCount(1);

  await page.getByLabel('New task').click();
  await page.getByLabel('Title').fill('Timeline settings task');
  await page.getByLabel('Date').fill(new Date().toISOString().slice(0, 10));
  await page.getByLabel('Start').fill('09:00');
  await page.getByRole('button', { name: /save task/i }).click();

  await expect(page.locator('[data-testid=timeline-hour-line]').first()).toBeVisible();
  await expect(page.locator('[data-testid=timeline-now-line]')).toBeVisible();
  await expect(page.getByTestId('main-sidebar-resizer')).toBeVisible();

  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: 'Appearance' }).click();
  await page.getByLabel('Clock background').uncheck();
  await page.getByLabel('Resize bars').uncheck();
  await page.getByLabel('Hourly timeline guide lines').uncheck();
  await page.getByLabel('Current time red line').uncheck();
  await page.getByLabel('Resize bar thickness').fill('12');
  await page.getByLabel('Resize bar length').fill('88');
  await page.getByLabel('Resize bar color').fill('#ff2d55');
  await page.getByRole('button', { name: /close settings/i }).click();

  await expect(clock).toHaveAttribute('data-clock-background', 'false');
  await expect(page.getByTestId('main-sidebar-resizer')).toHaveCount(0);
  await expect(page.locator('[data-testid=timeline-hour-line]')).toHaveCount(0);
  await expect(page.locator('[data-testid=timeline-now-line]')).toHaveCount(0);

  await page.getByRole('button', { name: /open clock settings/i }).click();
  await expect(page.getByRole('heading', { name: /preferences/i })).toBeVisible();
  await page.getByRole('button', { name: /increase clock text size/i }).click();
  await expect(page.getByTestId('clock-time')).toBeVisible();
});

test('customizes Liquid Glass colors and exposes material surfaces', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: 'Appearance' }).click();
  await page.getByRole('combobox').first().selectOption('theme:liquid-glass');
  await page.getByLabel('Main color').fill('#ff2d55');
  await page.getByLabel('Secondary color').fill('#34c759');
  await page.getByRole('button', { name: /close settings/i }).click();

  const shell = page.locator('.app-shell');
  await expect(shell).toHaveAttribute('data-visual-theme', 'liquid-glass');
  await expect(page.getByTestId('app-sidebar')).toHaveAttribute('data-material', 'sidebar');
  await expect(page.locator('.app-header')).toHaveAttribute('data-material', 'control');

  const tokens = await shell.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      main: style.getPropertyValue('--theme-main').trim(),
      secondary: style.getPropertyValue('--theme-secondary').trim(),
      glassBlur: style.getPropertyValue('--theme-glass-blur').trim(),
      radiusPanel: style.getPropertyValue('--theme-radius-panel').trim()
    };
  });

  expect(tokens).toEqual({
    main: '#ff2d55',
    secondary: '#34c759',
    glassBlur: '34px',
    radiusPanel: '28px'
  });
});

test('creates, resets, and removes a synced profile', async ({ page }) => {
  const profileName = `E2E Profile ${Date.now()}`;

  await page.goto('/');
  await page.getByRole('button', { name: /open settings/i }).click();

  await page.getByRole('button', { name: /^profiles$/i }).click();
  const profilesSection = page.locator('section').filter({ hasText: 'Profiles' });
  await profilesSection.getByPlaceholder('New profile name').fill(profileName);
  await profilesSection.getByRole('button', { name: /create/i }).click();
  await expect(profilesSection.getByRole('combobox')).toContainText(profileName);

  await page.getByRole('button', { name: /close settings/i }).click();
  await createTask(page, 'Profile reset smoke');
  await page.getByRole('button', { name: /open settings/i }).click();

  await page.getByRole('button', { name: /^profiles$/i }).click();
  await profilesSection.getByRole('button', { name: /^reset$/i }).click();
  await page.getByRole('button', { name: /reset profile/i }).click();
  await page.getByRole('button', { name: /list/i }).click();
  await searchTasks(page, 'Profile reset smoke');
  await expect(page.getByText('Profile reset smoke')).toHaveCount(0);

  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: /^profiles$/i }).click();
  await profilesSection.getByRole('button', { name: /^remove$/i }).click();
  await page.getByRole('button', { name: /remove profile/i }).click();
  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: /^profiles$/i }).click();
  await expect(profilesSection.getByRole('combobox')).not.toContainText(profileName);
});

test('keeps role presets and role hours scoped to the active profile', async ({ page }) => {
  const profileName = `Clean Roles ${Date.now()}`;

  await page.goto('/');
  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: /^roles$/i }).click();
  await page.getByRole('button', { name: /^preset$/i }).click();
  await expect(page.locator('input[value="Backend"]')).toBeVisible();
  await page.getByRole('button', { name: /close settings/i }).click();

  await page.getByRole('button', { name: /analytics/i }).click();
  const roleHours = page.locator('section').filter({ hasText: 'Role Hours' });
  await expect(roleHours).toContainText('Backend');

  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: /^profiles$/i }).click();
  const profilesSection = page.locator('section').filter({ hasText: 'Profiles' });
  await profilesSection.getByPlaceholder('New profile name').fill(profileName);
  await profilesSection.getByRole('button', { name: /create/i }).click();
  await expect(profilesSection.getByRole('combobox')).toContainText(profileName);
  await page.getByRole('button', { name: /close settings/i }).click();

  await expect(roleHours).toContainText('No roles defined.');
  await expect(roleHours).not.toContainText('Backend');
});

test('prompts on dirty modal close and supports discard or save', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('New task').click();
  await page.getByLabel('Title').fill('Discarded dirty edit');
  await page.mouse.click(8, 8);
  await expect(page.getByRole('heading', { name: /save changes/i })).toBeVisible();
  await page
    .getByRole('button', { name: /^discard$/i })
    .last()
    .click();
  await page.getByRole('button', { name: /list/i }).click();
  await searchTasks(page, 'Discarded dirty edit');
  await expect(page.getByText('Discarded dirty edit')).toHaveCount(0);

  await page.getByLabel('New task').click();
  await page.getByLabel('Title').fill('Saved dirty edit');
  await page.mouse.click(8, 8);
  await page.getByRole('button', { name: /save changes/i }).click();
  await searchTasks(page, 'Saved dirty edit');
  await expectTaskVisible(page, 'Saved dirty edit');
});

test('merges imported tasks into the active profile', async ({ page }) => {
  const importedTitle = `Imported Merge ${Date.now()}`;
  const task = {
    id: `imported-${Date.now()}`,
    title: importedTitle,
    status: 'new',
    urgency: 4,
    tags: ['import'],
    scheduledDate: '',
    scheduledStart: '',
    scheduledEnd: '',
    recurrence: 'none',
    recurrenceRootId: null,
    subtasks: [],
    logs: [],
    activeLogStart: null,
    activity: []
  };

  await page.goto('/');
  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: /^tasks data$/i }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'tasks.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, tasks: [task] }))
  });

  await expect(page.getByRole('heading', { name: /import preview/i })).toBeVisible();
  await page.getByRole('button', { name: /merge import/i }).click();
  await page.getByRole('button', { name: /list/i }).click();
  await searchTasks(page, importedTitle);
  await expectTaskVisible(page, importedTitle);
});

test('persists sidebar resizing through server-backed settings', async ({ page, request }) => {
  const settingsLoaded = page.waitForResponse(
    (response) =>
      response.url().includes('/api/profiles/') &&
      response.url().includes('/settings') &&
      response.request().method() === 'GET'
  );
  await page.goto('/');
  await settingsLoaded;
  const profileControl = page.getByTestId('active-profile-control');
  await expect(profileControl).toHaveAttribute('data-active-profile-id', /.+/);
  const activeProfileId = await profileControl.getAttribute('data-active-profile-id');

  const sidebar = page.getByTestId('app-sidebar');
  const initialWidth = await sidebar.evaluate((element) => element.getBoundingClientRect().width);
  const resizerBox = await page.getByTestId('main-sidebar-resizer').boundingBox();
  expect(resizerBox).not.toBeNull();

  const settingsSaved = page.waitForResponse((response) => {
    if (
      !response.url().includes(`/api/profiles/${activeProfileId}/settings`) ||
      response.request().method() !== 'PUT' ||
      response.status() !== 200
    ) {
      return false;
    }

    const postData = response.request().postDataJSON() as { settings?: { sidebarWidth?: number } } | null;
    return Number(postData?.settings?.sidebarWidth || 0) > initialWidth;
  });
  await page.mouse.move(resizerBox!.x + resizerBox!.width / 2, resizerBox!.y + resizerBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(resizerBox!.x - 90, resizerBox!.y + resizerBox!.height / 2, { steps: 6 });
  await page.mouse.up();
  await settingsSaved;

  await expect
    .poll(async () => sidebar.evaluate((element) => element.getBoundingClientRect().width))
    .toBeGreaterThan(initialWidth);
  const resizedWidth = await sidebar.evaluate((element) => element.getBoundingClientRect().width);

  await expect
    .poll(async () => {
      const response = await request.get(api(`/api/profiles/${activeProfileId}/settings`));
      const body = await response.json();
      return body.settings?.sidebarWidth ?? 0;
    })
    .toBeGreaterThan(initialWidth);
  await page.reload();
  await expect
    .poll(async () => sidebar.evaluate((element) => element.getBoundingClientRect().width))
    .toBeGreaterThan(resizedWidth - 5);
});

test('adjusts clock text size with sidebar controls', async ({ page }) => {
  await page.goto('/');

  const clock = page.getByTestId('clock-time');
  const initialSize = await clock.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize)
  );

  await page.getByRole('button', { name: /open clock settings/i }).click();
  await page.getByRole('button', { name: /increase clock text size/i }).click();
  await expect
    .poll(async () => clock.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
    .toBeGreaterThan(initialSize);

  await page.getByRole('button', { name: /decrease clock text size/i }).click();
  await expect
    .poll(async () => clock.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
    .toBeLessThan(initialSize + 1);
});

test('uses current task pin to track and complete the active task', async ({ page }) => {
  await page.goto('/');
  await createTask(page, 'Pinned flow task');

  const pin = page.getByTestId('current-task-pin').first();
  await expect(pin).toContainText('Pinned flow task');

  await pin.getByRole('button', { name: /^start$/i }).click();
  await expect(pin.getByRole('button', { name: /^stop$/i })).toBeVisible();
  await pin.getByRole('button', { name: /^stop$/i }).click();
  await expect(pin.getByRole('button', { name: /^start$/i })).toBeVisible();

  await pin.getByRole('button', { name: /^done$/i }).click();
  await expect(page.getByTestId('current-task-pin').first()).toContainText('No active task pinned');
});

test('enables monk mode and switches visual theme', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /enter monk mode/i }).click();
  await expect(page.getByRole('heading', { name: /monk mode/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /analytics/i })).toHaveCount(0);

  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: 'Appearance' }).click();
  const appearanceSection = page.locator('section').filter({ hasText: 'Appearance' });
  await appearanceSection.getByRole('combobox').first().selectOption('theme:terminal-clean');
  await expect(page.locator('[data-monk-mode][data-visual-theme="terminal-clean"]')).toBeVisible();
});

test('uses the shared themed dropdown surface for filters and profiles', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('active-profile-control').click();
  const profileMenu = page.locator('.themed-menu').filter({ hasText: 'Profiles' });
  await expect(profileMenu).toBeVisible();
  await expect(profileMenu).toHaveCSS('backdrop-filter', /blur/);

  await page.mouse.click(8, 8);
  await page.getByRole('button', { name: /filters/i }).click();
  const filterMenu = page.locator('.themed-menu').filter({ hasText: 'Filter by Tags' });
  await expect(filterMenu).toBeVisible();
  await expect(filterMenu).toHaveCSS('backdrop-filter', /blur/);
});

test('keeps themed modals readable in terminal themes', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: /^appearance$/i }).click();
  const appearanceSection = page.locator('section').filter({ hasText: 'Appearance' });
  await appearanceSection.getByRole('combobox').first().selectOption('theme:terminal');

  await expect(page.getByRole('dialog', { name: /preferences/i })).toHaveCSS('color', 'rgb(124, 255, 138)');

  await appearanceSection.getByRole('combobox').first().selectOption('theme:terminal-clean-white');
  await expect(page.getByRole('dialog', { name: /preferences/i })).toHaveCSS('color', 'rgb(255, 255, 255)');
});

test('uses opaque blurred liquid glass dropdowns for readability', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: /^appearance$/i }).click();
  await page
    .locator('section')
    .filter({ hasText: 'Appearance' })
    .getByRole('combobox')
    .first()
    .selectOption('theme:liquid-glass');
  await page.getByRole('button', { name: /close settings/i }).click();

  await page.getByRole('button', { name: /filters/i }).click();
  const filterMenu = page.locator('.themed-menu').filter({ hasText: 'Filter by Tags' });
  await expect(filterMenu).toBeVisible();
  await expect(filterMenu).toHaveCSS('backdrop-filter', /blur/);
  await expect
    .poll(async () =>
      filterMenu.evaluate((element) => {
        const style = getComputedStyle(element);
        return `${style.backgroundImage} ${style.backgroundColor}`;
      })
    )
    .not.toContain('rgba(0, 0, 0, 0)');
});

test('toggles animations from settings', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: /^appearance$/i }).click();
  await page.getByLabel('Animations').uncheck();

  await expect(page.locator('[data-monk-mode]')).toHaveAttribute('data-animations-enabled', 'false');
});

test('keeps a mobile-created task after reload', async ({ page, request }) => {
  const mobileTitle = `Mobile Sync ${Date.now()}`;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const activeProfileId = await page.evaluate(() =>
    localStorage.getItem('the-monastery_active_profile_id_v1')
  );

  await createTask(page, mobileTitle);
  await expect
    .poll(async () => {
      const response = await request.get(api(`/api/profiles/${activeProfileId}/tasks`));
      const body = await response.json();
      return body.tasks.some((task) => task.title === mobileTitle);
    })
    .toBe(true);
  await page.reload();
  await searchTasks(page, mobileTitle);
  await expectTaskVisible(page, mobileTitle);
});
