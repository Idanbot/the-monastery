import { expect, test } from './fixtures';
import {
  api,
  browserToday,
  chooseTheme,
  completeBreathingIntro,
  createScheduledTask,
  createTask,
  expectTaskVisible,
  openSettingsSection,
  resetServerState,
  searchTasks
} from './helpers';

test.beforeEach(async ({ page, request }) => {
  const activeProfileId = await resetServerState(request);
  await page.addInitScript((profileId) => {
    localStorage.clear();
    localStorage.setItem('the-monastery_active_profile_id_v1', profileId);
  }, activeProfileId);
});

test('shows the app version indicator without implementation labels', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('app-version-chip')).toHaveText(/^v1\.0\.(?:dev|\d+)$/);
  await expect(page.getByTestId('app-version-chip')).not.toContainText(/fe|be|frontend|backend/i);
  const health = await page.request.get('/api/health');
  expect('v' + (await health.json()).version).toBe(await page.getByTestId('app-version-chip').textContent());
});

test('keeps the desktop header within a compact viewport', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/');

  const header = page.locator('.app-header');
  await expect(header).toBeVisible();
  await expect(header.getByRole('button', { name: /open settings/i })).toBeVisible();
  await expect(header.getByRole('button', { name: /backlog task/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /hide clock|show clock/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /shortcuts & guide/i })).toHaveCount(0);
  expect(await header.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

  await page.setViewportSize({ width: 1080, height: 900 });
  const createTaskButton = header.getByRole('button', { name: /backlog task/i });
  await expect(createTaskButton).toContainText('Task');
  await expect(header.getByRole('button', { name: /open settings/i })).toBeVisible();
  expect(await header.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
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

test('persists task notes, goals, and deletions across reloads', async ({ page }) => {
  const title = 'Persistent note task';

  await page.goto('/');
  await createTask(page, title);
  await page.getByText(title).first().click();
  await page.getByRole('button', { name: /^notes$/i }).click();
  await page.getByPlaceholder('Add a note...').fill('Persistence note survives reload');
  await page.getByRole('button', { name: /^add note$/i }).click();
  await page.getByRole('button', { name: /save task/i }).click();

  await page.keyboard.press('m');
  await completeBreathingIntro(page);
  const profileId = await page.getByTestId('active-profile-control').getAttribute('data-active-profile-id');
  if (!profileId) throw new Error('Missing active profile id');
  await page.getByPlaceholder('One outcome for today').fill('Persist monk goal');
  await expect
    .poll(async () => {
      const response = await page.request.get(`/api/profiles/${profileId}/settings`);
      const body = await response.json();
      return body.settings?.dailyGoal || '';
    })
    .toBe('Persist monk goal');

  await page.reload();
  await expect(page.getByTestId('active-profile-control')).toHaveAttribute(
    'data-active-profile-id',
    profileId
  );
  await expect
    .poll(async () => {
      const response = await page.request.get(`/api/profiles/${profileId}/settings`);
      const body = await response.json();
      return body.settings?.dailyGoal || '';
    })
    .toBe('Persist monk goal');
  if ((await page.getByTestId('one-breath').count()) > 0) {
    await completeBreathingIntro(page);
  }
  if ((await page.getByTestId('monk-mode-view').count()) === 0) {
    await page.getByRole('button', { name: /enter monk mode/i }).click();
    await completeBreathingIntro(page);
  }
  await expect(page.getByTestId('monk-mode-view')).toBeVisible();
  const goalInput = page.getByPlaceholder('One outcome for today');
  await expect(goalInput).toHaveValue('Persist monk goal');
  await page
    .getByTestId('monk-mode-view')
    .getByRole('button', { name: /exit monk mode/i })
    .click();
  await page.getByRole('button', { name: /list/i }).click();
  await searchTasks(page, title);
  await expectTaskVisible(page, title);
  await page.getByText(title).first().click();
  await page.getByRole('button', { name: /^activity$/i }).click();
  await expect(page.getByTestId('task-modal').getByText('Persistence note survives reload')).toBeVisible();
  await page.getByRole('button', { name: /save task/i }).click();

  await page.getByRole('button', { name: /list/i }).click();
  await searchTasks(page, title);
  await page.getByText(title).first().click();
  await page.getByRole('button', { name: /delete task/i }).click();
  await page.getByRole('button', { name: /^delete$/i }).click();
  await expect
    .poll(async () => {
      const response = await page.request.get(`/api/profiles/${profileId}/tasks`);
      const body = await response.json();
      return (body.tasks || []).some((task) => task.title === title);
    })
    .toBe(false);

  await page.reload();
  const exitMonk = page.getByRole('button', { name: /exit monk mode/i });
  if ((await exitMonk.count()) > 0 && (await exitMonk.first().isVisible())) {
    await exitMonk.first().click();
  }
  await page.getByRole('button', { name: /list/i }).click();
  await searchTasks(page, title);
  await expect(page.getByText(title)).toHaveCount(0);
});

test('adds a task tag from the fuzzy tag pool', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Backlog task').click();
  await page.getByLabel('Title').fill('Pool tag smoke');
  await page.getByRole('textbox', { name: /find tag/i }).fill('py');
  await page.getByRole('button', { name: /^python$/i }).click();
  await page.getByRole('button', { name: /save task/i }).click();

  await page.getByRole('button', { name: /filters/i }).click();
  await page.getByRole('option', { name: /^python$/i }).click();
  await expectTaskVisible(page, 'Pool tag smoke');

  await page.getByRole('button', { name: /filters/i }).click();
  await page.getByLabel('Backlog task').click();
  await page.getByLabel('Title').fill('Custom inventory smoke');
  await page.getByPlaceholder(/backend, high priority/i).fill('architecture-review');
  await page.getByRole('button', { name: /save task/i }).click();
  await page.getByRole('button', { name: /filters/i }).click();
  await page.getByRole('combobox', { name: /search known tags/i }).fill('architecture');
  await expect(page.getByRole('option', { name: 'architecture-review' })).toBeVisible();
});

test('manages tag aliases, role links, and goals through settings', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Backlog task').click();
  await page.getByLabel('Title').fill('Taxonomy source task');
  await page.getByPlaceholder(/backend, high priority/i).fill('otel');
  await page.getByRole('button', { name: /save task/i }).click();

  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: /^roles$/i }).click();
  await page.getByRole('button', { name: /^add$/i }).click();
  await page.getByLabel('Role name New Role').fill('Platform');
  await page.getByRole('button', { name: /^tags$/i }).click();

  await page.getByLabel('Manage tag').selectOption('otel');
  await page.getByLabel('Rename selected tag').fill('observability');
  await page.getByRole('button', { name: /^rename tag$/i }).click();
  await expect(page.getByLabel('Manage tag')).toHaveValue('observability');

  await page.getByLabel('New alias').fill('otel');
  await page.getByRole('button', { name: /^add alias$/i }).click();
  await page.getByLabel('Connect Platform').check();
  await page.getByLabel('Weekly goal for observability').fill('4');
  await page.getByRole('button', { name: /close settings/i }).click();

  await page.getByText('Taxonomy source task').first().click();
  await expect(page.getByPlaceholder(/backend, high priority/i)).toHaveValue('observability');
  await page.getByRole('button', { name: /save task/i }).click();

  await page.getByLabel('Backlog task').click();
  await page.getByLabel('Title').fill('Alias task');
  await page.getByPlaceholder(/backend, high priority/i).fill('otel');
  await expect(page.getByPlaceholder(/backend, high priority/i)).toHaveValue('observability');
  await page.getByRole('button', { name: /save task/i }).click();

  const profileId = await page.getByTestId('active-profile-control').getAttribute('data-active-profile-id');
  if (!profileId) throw new Error('Missing active profile id');
  await expect
    .poll(async () => {
      const response = await page.request.get(`/api/profiles/${profileId}/settings`);
      const body = await response.json();
      return {
        alias: body.settings?.tagAliases?.otel,
        roleTags: body.settings?.roles?.find((role) => role.name === 'Platform')?.tags || [],
        weekly: body.settings?.tagGoals?.find((goal) => goal.tag === 'observability')?.weeklyTargetHours
      };
    })
    .toEqual({ alias: 'observability', roleTags: ['observability'], weekly: 4 });
});

test('plans day, suggests title tags, opens shortcuts, and records local backup history', async ({
  page
}) => {
  await page.goto('/');

  await page.getByLabel('Backlog task').click();
  await page.getByLabel('Title').fill('Python plan smoke');
  await page.getByRole('button', { name: /add suggested tag python/i }).click();
  await expect(page.getByPlaceholder(/backend, high priority/i)).toHaveValue('python');
  await page.getByRole('button', { name: /save task/i }).click();

  await createTask(page, 'Unscheduled day plan smoke');
  await page.getByText('Unscheduled day plan smoke').first().click();
  await page.getByLabel('Status').selectOption('in-progress');
  await page.getByRole('button', { name: /save task/i }).click();
  await page.getByRole('button', { name: /plan day/i }).click();
  await expect(page.getByRole('region', { name: /focus planning/i })).toBeVisible();
  await expect(page.getByTestId('focus-plan-suggestions')).toContainText('Unscheduled day plan smoke');
  await page.getByRole('button', { name: /apply focus plan/i }).click();
  await expect(page.getByTestId('timeline-task-Unscheduled day plan smoke')).toBeVisible();

  await page.keyboard.press('?');
  const shortcutsDialog = page.getByRole('dialog', { name: /keyboard shortcuts/i });
  await expect(shortcutsDialog).toBeVisible();
  await expect(shortcutsDialog).toContainText('Ctrl+K');
  await expect(shortcutsDialog).toContainText('Command palette');
  await page.getByRole('button', { name: /close keyboard shortcuts/i }).click();

  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: /^tasks data$/i }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /backup/i }).click();
  await downloadPromise;
  await expect(page.getByText(/local backup history/i)).toBeVisible();
  await expect(page.getByText(/2 tasks/i)).toBeVisible();
});

test('adds five task-context tags and finds the task by note text', async ({ page, request }) => {
  await page.goto('/');
  await page.getByLabel('Backlog task').click();
  const taskModal = page.getByTestId('task-modal');
  await taskModal.getByLabel('Title').fill('Design EKS Kubernetes cutover');
  await taskModal.getByRole('button', { name: /^add$/i }).click();
  await page.getByPlaceholder('Subtask title').fill('Validate BGP routes');
  await taskModal.getByRole('button', { name: /^notes$/i }).click();
  await page.getByPlaceholder('Add a note...').fill('Document rollback procedure before launch');
  await taskModal.getByRole('button', { name: /^add note$/i }).click();
  await taskModal.getByRole('button', { name: /add 5 relevant tags/i }).click();
  await expect(page.getByPlaceholder(/backend, high priority/i)).toHaveValue(
    'cutover, eks, kubernetes, bgp, rollback'
  );
  await taskModal.getByRole('button', { name: /save task/i }).click();

  const profileId = await page.getByTestId('active-profile-control').getAttribute('data-active-profile-id');
  if (!profileId) throw new Error('Missing active profile id');
  await expect
    .poll(async () => {
      const response = await request.get(api(`/api/profiles/${profileId}/search?q=rollback`));
      const body = await response.json();
      return body.results?.[0]?.title;
    })
    .toBe('Design EKS Kubernetes cutover');

  await searchTasks(page, 'rollback');
  const results = page.locator('[data-testid="unified-search-results"]:visible');
  await results.getByRole('button', { name: /design eks kubernetes cutover/i }).click();
  await expect(page.getByLabel('Title')).toHaveValue('Design EKS Kubernetes cutover');
});

test('opens settings and exposes backup/import controls', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /open settings/i }).click();

  await expect(page.getByRole('heading', { name: /preferences/i })).toBeVisible();
  await page.getByRole('button', { name: /^tasks data$/i }).click();
  await expect(page.getByRole('button', { name: /backup/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Import', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /import ics/i })).toBeVisible();
});

test('imports calendar ICS tasks from the settings UI', async ({ page }) => {
  await page.goto('/');
  await openSettingsSection(page, /^tasks data$/i);
  await page.getByTestId('ics-import-input').setInputFiles({
    name: 'learning-session.ics',
    mimeType: 'text/calendar',
    buffer: Buffer.from(
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'UID:learning-session-1',
        'SUMMARY:Course Deep Dive',
        'DESCRIPTION:Watch module and capture notes',
        'DTSTART:20260620T090000Z',
        'DTEND:20260620T103000Z',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\n')
    )
  });

  await expect(page.getByRole('heading', { name: /import preview/i })).toBeVisible();
  await page.getByRole('button', { name: /merge import/i }).click();
  await page.getByRole('button', { name: /list/i }).click();
  await searchTasks(page, 'Course Deep Dive');
  await expectTaskVisible(page, 'Course Deep Dive');
  await page.getByText('Course Deep Dive').first().click();
  await page.getByRole('button', { name: /^activity$/i }).click();
  await expect(
    page.getByTestId('task-modal').getByText(/Imported from calendar: Watch module and capture notes/)
  ).toBeVisible();
});

test('customizes clock, resize handles, and timeline guides from settings', async ({ page }) => {
  await page.goto('/');

  const clock = page.locator('.clock-widget');
  await expect(clock).toBeVisible();
  await expect(clock.locator('button')).toHaveCount(1);

  await createScheduledTask(page, 'Timeline settings task', await browserToday(page), '09:00');

  await expect(page.locator('[data-testid=timeline-hour-line]').first()).toBeVisible();
  await expect(page.locator('[data-testid=timeline-now-line]')).toBeVisible();
  await expect(page.getByTestId('main-sidebar-resizer')).toBeVisible();

  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: 'Appearance' }).click();
  await expect(page.getByLabel('Hourly timeline guide lines')).toHaveCount(0);
  await expect(page.getByLabel('Resize bars')).toHaveCount(0);
  await page.getByRole('button', { name: 'Board' }).click();
  await page.getByLabel('Resize bars').uncheck();
  await page.getByLabel('Resize bar thickness').fill('12');
  await page.getByLabel('Resize bar length').fill('88');
  await page.getByLabel('Resize bar color').fill('#ff2d55');
  await page.getByRole('button', { name: 'Time' }).click();
  await page.getByRole('checkbox', { name: 'Clock background' }).uncheck();
  await page.getByLabel('Hourly timeline guide lines').uncheck();
  await page.getByLabel('Current time red line').uncheck();
  await page.getByLabel('Clock text color').fill('#1d1d1f');
  await page.getByLabel('Clock background color').fill('#f5f5f7');
  await page.getByRole('button', { name: /analog clock/i }).click();
  await expect(page.getByRole('button', { name: /increase clock size/i })).toHaveText('+');
  await page.getByRole('button', { name: /close settings/i }).click();

  await expect(clock).toHaveAttribute('data-clock-background', 'false');
  await expect(clock).toHaveAttribute('data-clock-mode', 'analog');
  await expect(page.getByTestId('clock-analog')).toBeVisible();
  await expect(page.getByTestId('main-sidebar-resizer')).toHaveCount(0);
  await expect(page.locator('[data-testid=timeline-hour-line]')).toHaveCount(0);
  await expect(page.locator('[data-testid=timeline-now-line]')).toHaveCount(0);

  await page.getByRole('button', { name: /open clock settings/i }).click();
  await expect(page.getByRole('heading', { name: /preferences/i })).toBeVisible();
  await page.getByRole('button', { name: /increase clock size/i }).click();
  await expect(page.getByTestId('clock-analog')).toBeVisible();
});

test('keeps theme gallery readable and stable while switching themes', async ({ page }) => {
  await page.goto('/');

  await openSettingsSection(page, 'Appearance');

  const gallery = page.getByTestId('theme-gallery');
  await expect(gallery).toBeVisible();
  await expect(page.getByTestId('theme-gallery-card')).toHaveCount(16);
  await expect(page.getByTestId('theme-gallery-group-light')).not.toContainText('Nord');
  await expect(page.getByTestId('theme-gallery-group-dark')).toContainText('Nord');

  const readability = await page.getByTestId('theme-gallery-label').evaluateAll((labels) => {
    const parseRgb = (value) => {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : [0, 0, 0];
    };
    const luminance = ([r, g, b]) => {
      const channels = [r, g, b].map((channel) => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const contrast = (a, b) => {
      const light = Math.max(luminance(a), luminance(b));
      const dark = Math.min(luminance(a), luminance(b));
      return (light + 0.05) / (dark + 0.05);
    };

    return labels.map((label) => {
      const style = getComputedStyle(label);
      return {
        text: label.textContent?.trim(),
        contrast: contrast(parseRgb(style.color), parseRgb(style.backgroundColor)),
        fits: label.scrollWidth <= label.clientWidth + 1
      };
    });
  });

  expect(readability.every((item) => item.contrast >= 4.5 && item.fits)).toBe(true);

  const shell = page.locator('.app-shell');
  await expect(shell).toHaveAttribute('data-visual-theme', 'zen');
  await page.locator('[data-theme-card="dracula"]').hover();
  await expect(shell).toHaveAttribute('data-visual-theme', 'zen');

  const beforeBox = await page.getByRole('dialog', { name: /preferences/i }).boundingBox();
  for (const themeId of ['liquid-glass', 'terminal', 'github-light', 'dracula', 'zen']) {
    await chooseTheme(page, themeId);
  }
  const afterBox = await page.getByRole('dialog', { name: /preferences/i }).boundingBox();

  await expect(shell).toHaveAttribute('data-visual-theme', 'zen');
  await expect(page.locator('[data-testid="theme-gallery-card"][aria-pressed="true"]')).toHaveCount(1);
  expect(Math.abs((afterBox?.y || 0) - (beforeBox?.y || 0))).toBeLessThan(4);

  const transitionProperties = await page
    .getByTestId('theme-gallery-card')
    .evaluateAll((cards) => cards.map((card) => getComputedStyle(card).transitionProperty));
  expect(transitionProperties.every((property) => property !== 'all')).toBe(true);
});

test('customizes Liquid Glass colors and exposes material surfaces', async ({ page }) => {
  await page.goto('/');

  await openSettingsSection(page, 'Appearance');
  await chooseTheme(page, 'liquid-glass');
  await page.getByLabel('Main color').fill('#ff2d55');
  await page.getByLabel('Secondary color').fill('#34c759');
  await page.getByLabel('Text color').fill('#2c2c2e');
  await expect(page.getByTestId('theme-gallery')).not.toContainText('Terminal Clean');
  await page.getByRole('button', { name: /close settings/i }).click();

  const shell = page.locator('.app-shell');
  await expect(shell).toHaveAttribute('data-visual-theme', 'liquid-glass');
  await expect(page.getByTestId('app-sidebar')).toHaveAttribute('data-material', 'sidebar');
  await expect(page.locator('.app-header')).toHaveAttribute('data-material', 'control');

  const resizeGrip = page.locator('.resize-grip-vertical').first();
  await expect(resizeGrip).toBeVisible();
  await expect
    .poll(async () => resizeGrip.evaluate((element) => element.getBoundingClientRect().height))
    .toBeLessThan(80);
  await expect
    .poll(async () =>
      resizeGrip.evaluate((element) => getComputedStyle(element.parentElement!).backgroundColor)
    )
    .toBe('rgba(0, 0, 0, 0)');

  const tokens = await shell.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      main: style.getPropertyValue('--theme-main').trim(),
      secondary: style.getPropertyValue('--theme-secondary').trim(),
      text: style.getPropertyValue('--theme-text').trim(),
      glassBlur: style.getPropertyValue('--theme-glass-blur').trim(),
      radiusPanel: style.getPropertyValue('--theme-radius-panel').trim()
    };
  });

  expect(tokens).toEqual({
    main: '#ff2d55',
    secondary: '#34c759',
    text: '#2c2c2e',
    glassBlur: '34px',
    radiusPanel: '28px'
  });
});

test('uses command palette, shortcuts, and task templates', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'TheMonastery' })).toBeVisible();

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
  await expect(page.getByRole('dialog', { name: /command palette/i })).toBeVisible();
  const paletteEffects = await page.getByTestId('command-palette-overlay').evaluate((element) => {
    const style = getComputedStyle(element);
    return { backgroundColor: style.backgroundColor, backdropFilter: style.backdropFilter };
  });
  expect(paletteEffects.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(paletteEffects.backdropFilter).not.toBe('none');
  await page.getByRole('option', { name: /backlog focus task/i }).click();
  await page.getByLabel('Title').fill('Palette focus task');
  await page.getByRole('button', { name: /save task/i }).click();
  await expectTaskVisible(page, 'Palette focus task');

  await page.keyboard.press('n');
  await page.getByRole('button', { name: /deep work template/i }).click();
  await expect(page.getByLabel('Title')).toHaveValue('Deep Work Block');
  await page.getByLabel('Title').fill('Template task');
  await page.getByRole('button', { name: /save task/i }).click();
  await expectTaskVisible(page, 'Template task');

  await page.keyboard.press('m');
  await completeBreathingIntro(page);
  await expect(page.getByRole('heading', { name: /monk mode/i })).toBeVisible();
  await expect(page.getByTestId('monk-minimap')).toBeVisible();
});

test('searches tasks and applies scheduling, timer, status, and navigation commands', async ({ page }) => {
  test.setTimeout(60_000);
  const title = 'Palette command target';
  await page.goto('/');
  await createTask(page, title);
  await expect(page.getByTestId('task-modal')).toHaveCount(0);
  const profileId = await page.getByTestId('active-profile-control').getAttribute('data-active-profile-id');
  if (!profileId) throw new Error('Missing active profile id');
  await expect
    .poll(async () => {
      const response = await page.request.get(`/api/profiles/${profileId}/tasks`);
      const body = await response.json();
      return (body.tasks || []).map((task) => task.title);
    })
    .toContain(title);
  await page.reload();
  await expect(page.getByTestId('board-column-backlog')).toContainText(title);

  const openPalette = async (query: string) => {
    await page.keyboard.press('Control+K');
    await expect(page.getByRole('dialog', { name: /command palette/i })).toBeVisible();
    const input = page.locator('input[aria-label="Search commands"]');
    await expect(input).toBeVisible();
    await input.fill(query);
  };

  await openPalette(`start timer ${title}`);
  await page.getByRole('option', { name: `Start timer: ${title}` }).click();
  await openPalette(`stop timer ${title}`);
  await expect(page.getByRole('option', { name: `Stop timer: ${title}` })).toBeVisible();
  await page.keyboard.press('Escape');

  await openPalette(`schedule today ${title}`);
  await page.getByRole('option', { name: `Schedule today: ${title}` }).click();
  await page.getByTestId('board-column-backlog').getByText(title).click();
  await expect(page.getByLabel('Date')).toHaveValue(await browserToday(page));
  await page.getByRole('button', { name: /close task details/i }).click();

  await openPalette(`move ${title} to done`);
  await page.getByRole('option', { name: `Move ${title} to Done` }).click();
  await expect(page.getByTestId('board-column-done')).toContainText(title);

  await openPalette('go to calendar');
  await page.getByRole('option', { name: 'Go to calendar' }).click();
  await expect(page.getByTestId('calendar-view')).toBeVisible();
});

test('enables and sends browser notifications from settings', async ({ page }) => {
  await page.addInitScript(() => {
    const sent: Array<{ title: string; body: string }> = [];
    Object.defineProperty(window, '__testNotifications', { value: sent, configurable: true });
    class NotificationMock {
      static permission: NotificationPermission = 'default';
      static async requestPermission() {
        NotificationMock.permission = 'granted';
        return 'granted' as NotificationPermission;
      }
      onclick: (() => void) | null = null;
      constructor(title: string, options?: NotificationOptions) {
        sent.push({ title, body: options?.body || '' });
      }
      close() {}
    }
    Object.defineProperty(window, 'Notification', { value: NotificationMock, configurable: true });
  });

  await page.goto('/');
  await openSettingsSection(page, 'Time');
  await page.getByLabel('Browser notifications').check();
  await expect(page.getByLabel('Browser notifications')).toBeChecked();
  await page.getByRole('button', { name: 'Send test notification' }).click();

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { __testNotifications?: Array<{ title: string }> })
            .__testNotifications || []
      )
    )
    .toContainEqual(expect.objectContaining({ title: 'The Monastery' }));
});

test('exports and imports the active profile from settings', async ({ page }) => {
  await page.goto('/');
  await createTask(page, 'Profile portable task');

  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: /^profiles$/i }).click();
  await expect(page.getByRole('button', { name: /export profile/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /import profile/i })).toBeVisible();

  await page.getByTestId('profile-import-input').setInputFiles({
    name: 'profile.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        schemaVersion: 1,
        profile: {
          name: 'Imported Click Priority',
          settings: { roles: [{ id: 'imported-role', name: 'Imported Role', tags: ['imported'] }] },
          tasks: [{ id: 'imported-profile-task', title: 'Imported profile task' }]
        }
      })
    )
  });
  await expect(page.getByRole('heading', { name: /restore profile/i })).toBeVisible();
  await page.getByRole('button', { name: /restore profile/i }).click();
  await expect(page.getByRole('heading', { name: /restore profile/i })).toHaveCount(0);
  const closeSettings = page.getByRole('button', { name: /close settings/i });
  if ((await closeSettings.count()) > 0 && (await closeSettings.first().isVisible())) {
    await closeSettings.first().click();
  }
  await page.getByRole('button', { name: /list/i }).click();
  await searchTasks(page, 'Imported profile task');
  await expectTaskVisible(page, 'Imported profile task');
});

test('drags scheduled tasks on the timeline to update start time', async ({ page }) => {
  await page.goto('/');

  await createScheduledTask(page, 'Timeline drag task', await browserToday(page), '09:00', '10:00');
  await expect(page.getByText('Timeline drag task').first()).toBeVisible();

  const taskBlock = page.getByTestId('timeline-task-Timeline drag task');
  await expect(taskBlock).toBeVisible();
  const box = await taskBlock.boundingBox();
  if (!box) throw new Error('Missing timeline task box');
  const startY = box.y + box.height / 2;
  await taskBlock.dispatchEvent('mousedown', { clientY: startY, bubbles: true });
  await page.locator('body').dispatchEvent('mouseup', { clientY: startY + 60, bubbles: true });

  await expect(taskBlock).toHaveAttribute('data-scheduled-start', '10:00');
  await taskBlock.click();
  await expect(page.getByLabel('Start')).toHaveValue('10:00');
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

test('completes a full profile roles tasks analytics lifecycle', async ({ page }) => {
  test.setTimeout(240_000);
  const profileName = 'Analytics Flow ' + Date.now();

  await page.goto('/');
  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: /^profiles$/i }).click();
  const profilesSection = page.locator('section').filter({ hasText: 'Profiles' });
  await profilesSection.getByPlaceholder('New profile name').fill(profileName);
  await profilesSection.getByRole('button', { name: /create/i }).click();
  await expect(profilesSection.getByRole('combobox')).toContainText(profileName);

  await page.getByRole('button', { name: /^roles$/i }).click();
  const rolesSection = page.locator('section').filter({ hasText: 'Roles' });
  await rolesSection.getByRole('button', { name: /^preset$/i }).click();
  await expect(page.locator("input[value='Backend']")).toBeVisible();

  const addRole = async (name: string, tags: string) => {
    await rolesSection.getByRole('button', { name: /^add$/i }).click();
    const nameInput = rolesSection.getByLabel('Role name New Role').last();
    await nameInput.fill(name);
    const roleCard = rolesSection.getByLabel(`Role name ${name}`).locator('..').locator('..');
    const tagInput = roleCard.getByPlaceholder('python, docker, backend');
    await tagInput.fill(tags);
    await tagInput.press('Enter');
  };

  await addRole('Frontend', 'frontend, react');
  await addRole('DevOps', 'devops, ci');
  await page.getByRole('button', { name: /close settings/i }).click();

  await page.getByLabel('Backlog task').click();
  await page.getByLabel('Title').fill('Backend shipped task');
  await page.getByLabel('Status').selectOption('done');
  await page.getByLabel('Tags').fill('backend');
  await page.getByRole('button', { name: 'Timer', exact: true }).click();
  await page.getByRole('button', { name: /add log/i }).click();
  await page.getByRole('button', { name: /save task/i }).click();

  await page.getByLabel('Backlog task').click();
  await page.getByLabel('Title').fill('Frontend rejected task');
  await page.getByLabel('Status').selectOption('rejected');
  await page.getByLabel('Tags').fill('frontend');
  await page.getByRole('button', { name: /add log/i }).click();
  await page.getByRole('button', { name: /save task/i }).click();

  await page.getByLabel('Backlog task').click();
  await page.getByLabel('Title').fill('Open backend task');
  await page.getByLabel('Tags').fill('backend');
  await page.getByRole('button', { name: /save task/i }).click();

  await page.getByRole('button', { name: 'Analytics', exact: true }).click();
  await expect(page.getByTestId('metric-backlog')).toContainText('1');
  await expect(page.getByTestId('metric-done')).toContainText('1');
  await expect(page.getByTestId('metric-rejected')).toContainText('1');
  await expect(page.getByTestId('role-radar-chart')).toBeVisible();
  await expect(page.getByTestId('role-radar-polygon')).toBeVisible();
  await expect(page.locator('section').filter({ hasText: 'Role Hours' })).toContainText('Backend');
  await expect(page.locator('section').filter({ hasText: 'Role Hours' })).toContainText('Frontend');
  await expect(page.locator('section').filter({ hasText: 'Tag Hours' })).toContainText('backend');
  await expect(page.locator('section').filter({ hasText: 'Focus Snapshot' })).toContainText('Top tag');

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

  await page.getByLabel('Backlog task').click();
  await page.getByLabel('Title').fill('Discarded dirty edit');
  await page.getByRole('button', { name: /close task details/i }).click();
  await expect(page.getByRole('heading', { name: /save changes/i })).toBeVisible();
  await page
    .getByRole('button', { name: /^discard$/i })
    .last()
    .click();
  await page.getByRole('button', { name: /list/i }).click();
  await searchTasks(page, 'Discarded dirty edit');
  await expect(page.getByText('Discarded dirty edit')).toHaveCount(0);

  await page.getByLabel('Backlog task').click();
  await page.getByLabel('Title').fill('Saved dirty edit');
  await page.getByRole('button', { name: /close task details/i }).click();
  await page.getByRole('button', { name: /save changes/i }).click();
  await searchTasks(page, 'Saved dirty edit');
  await expectTaskVisible(page, 'Saved dirty edit');
});

test('imports planning data with roles, tasks, tags, and goals', async ({ page }) => {
  await page.goto('/');
  await openSettingsSection(page, /^tasks data$/i);
  await page.getByTestId('planning-import-input').setInputFiles({
    name: 'planning.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        tasks: [{ id: 'planning-task', title: 'Imported planning task', tags: ['monk'] }],
        roles: [{ id: 'role-imported', name: 'Imported Role', tags: ['monk'], weeklyTargetHours: 4 }],
        tags: ['monk', 'deep-work'],
        goals: { monk: { dailyTargetHours: 1 }, 'deep-work': 5 }
      })
    )
  });

  await expect(page.getByRole('heading', { name: /import planning data/i })).toBeVisible();
  await page.getByRole('button', { name: /merge planning data/i }).click();
  await page.getByRole('button', { name: /list/i }).click();
  await searchTasks(page, 'Imported planning task');
  await expectTaskVisible(page, 'Imported planning task');

  await openSettingsSection(page, /^roles$/i);
  await expect(page.locator("input[value='Imported Role']")).toBeVisible();
  await expect(page.locator("input[value='monk']").first()).toBeVisible();
  await expect(page.locator("input[value='deep-work']")).toBeVisible();
});

test('merges imported tasks into the active profile', async ({ page }) => {
  const importedTitle = `Imported Merge ${Date.now()}`;
  const task = {
    id: `imported-${Date.now()}`,
    title: importedTitle,
    status: 'backlog',
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
    activity: [],
    notes: [
      'Youtube lesson: https://youtube.com/watch?v=monk123',
      { title: 'Course module', url: 'https://course.example/monk-mode' }
    ]
  };

  await page.goto('/');
  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: /^tasks data$/i }).click();
  await page.getByTestId('tasks-import-input').setInputFiles({
    name: 'tasks.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, tasks: [task] }))
  });

  await expect(page.getByRole('heading', { name: /import preview/i })).toBeVisible();
  await page.getByRole('button', { name: /merge import/i }).click();
  await page.getByRole('button', { name: /list/i }).click();
  await searchTasks(page, importedTitle);
  await expectTaskVisible(page, importedTitle);
  await page.getByText(importedTitle).first().click();
  await page.getByRole('button', { name: /^activity$/i }).click();
  const taskModal = page.getByTestId('task-modal');
  await expect(taskModal.getByText('Youtube lesson: https://youtube.com/watch?v=monk123')).toBeVisible();
  await expect(taskModal.getByText(/https:\/\/course\.example\/monk-mode/)).toBeVisible();
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
  await page.getByRole('button', { name: /increase clock size/i }).click();
  await expect
    .poll(async () => clock.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
    .toBeGreaterThan(initialSize);

  await page.getByRole('button', { name: /decrease clock size/i }).click();
  await expect
    .poll(async () => clock.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
    .toBeLessThan(initialSize + 1);
});

test('uses current task pin to track and complete the active task', async ({ page }) => {
  await page.goto('/');
  await createTask(page, 'Pinned flow task');
  await page.getByText('Pinned flow task').first().click();
  await page.getByLabel('Status').selectOption('in-progress');
  await page.getByRole('button', { name: /save task/i }).click();

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
  await appearanceSection.locator('[data-theme-card="terminal-white"]').click();
  await expect(page.locator('[data-monk-mode][data-visual-theme="terminal-white"]')).toBeVisible();
});

test('uses the shared themed dropdown surface for filters and profiles', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
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
  await appearanceSection.locator('[data-theme-card="terminal"]').click();

  await expect(page.getByRole('dialog', { name: /preferences/i })).toHaveCSS('color', 'rgb(124, 255, 138)');

  await appearanceSection.locator('[data-theme-card="terminal-white"]').click();
  await expect(page.getByRole('dialog', { name: /preferences/i })).toHaveCSS('color', 'rgb(255, 255, 255)');
});

test('uses opaque blurred liquid glass dropdowns for readability', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: /^appearance$/i }).click();
  await page
    .locator('section')
    .filter({ hasText: 'Appearance' })
    .locator('[data-theme-card="liquid-glass"]')
    .click();
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

test('uses one navigable mobile lane while preserving focus controls and collapse state', async ({
  page
}) => {
  const mobileTitle = `Mobile Layout ${Date.now()}`;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.locator('.app-header')).toBeHidden();
  await expect(page.getByTestId('mobile-shell')).toBeVisible();
  await expect(page.getByLabel('Shortcuts & Guide')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Create task' })).toBeVisible();

  await createTask(page, mobileTitle);
  await page.getByText(mobileTitle).first().click();
  await page.getByLabel('Status').selectOption('in-progress');
  await page.getByRole('button', { name: /save task/i }).click();

  const nextTitle = `Mobile Next ${Date.now()}`;
  await createTask(page, nextTitle);
  await page.getByText(nextTitle).first().click();
  await page.getByLabel('Status').selectOption('in-progress');
  await page.getByRole('button', { name: /save task/i }).click();

  const laneBoard = page.getByTestId('mobile-lane-board');
  await expect(laneBoard).toBeVisible();
  await expect(laneBoard.locator('[data-testid^="board-column-"]')).toHaveCount(1);
  await expect(laneBoard.getByRole('tab', { name: /in-progress, 2 tasks/i })).toBeVisible();
  await laneBoard.getByRole('tab', { name: /in-progress, 2 tasks/i }).click();
  await expect(laneBoard.getByTestId('board-column-in-progress')).toContainText(mobileTitle);
  await expect(laneBoard.getByTestId('board-column-in-progress')).toContainText(nextTitle);

  const mobileControls = page.getByTestId('mobile-board-controls');
  await expect(mobileControls).toBeVisible();
  await mobileControls.getByRole('button', { name: /use focused mobile view/i }).click();
  const focusView = page.getByTestId('mobile-focus-view');
  await expect(focusView).toBeVisible();
  await expect(focusView).toContainText(mobileTitle);
  await expect(focusView).toContainText(nextTitle);
  await expect(laneBoard).toBeHidden();
  await focusView.getByRole('button', { name: /start current task/i }).click();
  await expect(focusView.getByRole('button', { name: /stop current task/i })).toBeVisible();
  await focusView.getByRole('button', { name: /start next task/i }).click();
  await expect(
    focusView.getByRole('button', { name: new RegExp(`open current task ${mobileTitle}`, 'i') })
  ).toBeVisible();
  await focusView.getByRole('button', { name: /reject current task/i }).click();
  await focusView.getByRole('button', { name: /complete current task/i }).click();
  await mobileControls.getByRole('button', { name: /show full mobile board/i }).click();
  await laneBoard.getByRole('tab', { name: /rejected, 1 task/i }).click();
  await expect(laneBoard.getByTestId('board-column-rejected')).toContainText(mobileTitle);
  await laneBoard.getByRole('tab', { name: /done, 1 task/i }).click();
  await expect(laneBoard.getByTestId('board-column-done')).toContainText(nextTitle);

  await page.getByRole('button', { name: /collapse done lane/i }).click();
  await expect(laneBoard.getByTestId('board-column-done')).toHaveAttribute('data-collapsed', 'true');
  const profileId = await page.getByTestId('active-profile-control').getAttribute('data-active-profile-id');
  if (!profileId) throw new Error('Missing active profile id');
  await expect
    .poll(async () => {
      const response = await page.request.get(`/api/profiles/${profileId}/settings`);
      const body = await response.json();
      return body.settings?.collapsedBoardLanes || [];
    })
    .toContain('done');
  await page.reload();
  const reloadedLaneBoard = page.getByTestId('mobile-lane-board');
  await reloadedLaneBoard.getByRole('tab', { name: /done, 1 task/i }).click();
  await expect(reloadedLaneBoard.getByTestId('board-column-done')).toHaveAttribute('data-collapsed', 'true');
});

test('uses dedicated mobile navigation and a compact more sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const shell = page.getByTestId('mobile-shell');
  await shell.getByRole('button', { name: 'Today' }).click();
  await expect(page.getByTestId('mobile-focus-view')).toBeVisible();
  await shell.getByRole('button', { name: 'Board' }).click();
  await expect(page.getByTestId('mobile-lane-board')).toBeVisible();

  await shell.getByRole('button', { name: 'More' }).click();
  const more = page.getByRole('dialog', { name: 'More' });
  await expect(more.getByRole('button', { name: 'Projects' })).toBeVisible();
  await more.getByRole('button', { name: 'Filters' }).click();
  await expect(more.getByRole('combobox', { name: /search known tags/i })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(more).toBeHidden();

  await shell.getByRole('button', { name: 'Create task' }).click();
  await expect(page.getByTestId('task-modal')).toBeVisible();
});

test('plays and persists focus media while allowing a minimized player', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /focus media/i }).click();

  const dock = page.getByTestId('focus-media-dock');
  await expect(dock).toHaveAttribute('data-expanded', 'true');
  await expect(page.getByTitle('Focus media video')).toHaveAttribute(
    'src',
    /youtube-nocookie\.com\/embed\/4e839orj52w/
  );

  await page.getByLabel('Media URL').fill('https://media.example/focus.mp3');
  const saved = page.waitForResponse(
    (response) => response.url().includes('/settings') && response.request().method() === 'PUT'
  );
  await page.getByRole('button', { name: 'Load media' }).click();
  await saved;
  await expect(page.getByLabel('Focus audio player')).toHaveAttribute(
    'src',
    'https://media.example/focus.mp3'
  );

  const player = page.getByLabel('Focus audio player');
  await page.getByRole('button', { name: 'Minimize media player' }).click();
  await expect(dock).toHaveAttribute('data-expanded', 'false');
  await expect(player).toBeAttached();
  await page.getByRole('button', { name: 'Stop media' }).click();
  await expect(dock).toHaveCount(0);

  await page.reload();
  await page.getByRole('button', { name: /focus media/i }).click();
  await expect(page.getByLabel('Focus audio player')).toHaveAttribute(
    'src',
    'https://media.example/focus.mp3'
  );
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

test('searches and selects known tag filters on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByTestId('mobile-shell').getByRole('button', { name: 'More' }).click();
  const more = page.getByRole('dialog', { name: 'More' });
  await more.getByRole('button', { name: 'Filters' }).click();
  const tagSearch = more.getByRole('combobox', { name: /search known tags/i });
  await expect(tagSearch).toBeVisible();
  await tagSearch.fill('back');
  const backendOption = more.getByRole('option', { name: 'backend' });
  await expect(backendOption).toBeVisible();
  await backendOption.click();

  await expect(backendOption).toHaveAttribute('aria-selected', 'true');
});

test('persists a learning project with milestones', async ({ page }) => {
  await page.goto('/');
  await openSettingsSection(page, 'Projects');
  await page.getByRole('button', { name: 'Add project' }).click();
  await page.getByLabel('Project name').fill('Cloud Architect Track');
  await page.getByRole('button', { name: '+ milestone' }).click();
  await page.getByLabel('Milestone title').fill('Present migration plan');
  await page.getByLabel('Milestone complete').check();
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Close settings' }).click();
  await page.reload();
  await openSettingsSection(page, 'Projects');
  await expect(page.getByLabel('Project name')).toHaveValue('Cloud Architect Track');
  await expect(page.getByLabel('Milestone title')).toHaveValue('Present migration plan');
  await expect(page.getByLabel('Milestone complete')).toBeChecked();
  await page.getByRole('button', { name: 'Close settings' }).click();
  await page.getByTestId('view-switch-projects').click();
  await expect(page.getByTestId('projects-view')).toContainText('Cloud Architect Track');
});
