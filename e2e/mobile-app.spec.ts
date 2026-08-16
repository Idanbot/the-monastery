import { expect, test } from './fixtures';
import { expectNoHorizontalOverflow, registerCleanAppState } from './appTestSetup';
import { api, createTask, expectTaskVisible, searchTasks } from './helpers';

registerCleanAppState();

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
  const laneBoardBox = await laneBoard.boundingBox();
  expect(laneBoardBox?.width).toBeGreaterThanOrEqual(366);
  await expect(laneBoard.locator('[data-testid^="board-column-"]')).toHaveCount(1);
  await expect(laneBoard.getByRole('tab', { name: /in-progress, 2 tasks/i })).toBeVisible();
  for (const tab of await laneBoard.getByRole('tab').all()) {
    expect((await tab.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  }
  await laneBoard.getByRole('tab', { name: /in-progress, 2 tasks/i }).click();
  await expect(laneBoard.getByTestId('board-column-in-progress')).toContainText(mobileTitle);
  await expect(laneBoard.getByTestId('board-column-in-progress')).toContainText(nextTitle);

  const mobileShell = page.getByTestId('mobile-shell');
  await expect(page.getByRole('heading', { name: 'Board' })).toBeVisible();
  await mobileShell.getByRole('button', { name: 'Focus' }).click();
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
  await mobileShell.getByRole('button', { name: 'Tasks' }).click();
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
  await shell.getByRole('button', { name: 'Focus' }).click();
  await expect(page.getByTestId('mobile-focus-view')).toBeVisible();
  await shell.getByRole('button', { name: 'Tasks' }).click();
  await expect(page.getByTestId('mobile-lane-board')).toBeVisible();

  await shell.getByRole('button', { name: 'Calendar' }).click();
  const mobileAgenda = page.getByTestId('mobile-calendar-agenda');
  await expect(mobileAgenda).toBeVisible();
  await expect(page.getByTestId('calendar-scroll-area')).toHaveCount(0);
  expect(
    (await mobileAgenda.getByRole('button', { name: 'Today' }).boundingBox())?.height
  ).toBeGreaterThanOrEqual(44);

  await shell.getByRole('button', { name: 'More' }).click();
  const more = page.getByRole('dialog', { name: 'More' });
  await expect(more.getByRole('button', { name: 'Projects' })).toBeVisible();
  await more.getByRole('button', { name: 'Analytics' }).click();
  await expect(page.getByTestId('mobile-analytics-view')).toBeVisible();

  await shell.getByRole('button', { name: 'More' }).click();
  await page.getByRole('dialog', { name: 'More' }).getByRole('button', { name: 'Projects' }).click();
  await expect(page.getByTestId('projects-view')).toBeVisible();

  await shell.getByRole('button', { name: 'More' }).click();
  const reopenedMore = page.getByRole('dialog', { name: 'More' });
  await reopenedMore.getByRole('button', { name: 'Filters' }).click();
  await expect(reopenedMore.getByRole('combobox', { name: /search known tags/i })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(reopenedMore).toBeHidden();

  await shell.getByRole('button', { name: 'Create task' }).click();
  await expect(page.getByTestId('task-modal')).toBeVisible();
});

test('keeps primary mobile views readable at narrow and large phone widths', async ({ page }) => {
  for (const width of [320, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const shell = page.getByTestId('mobile-shell');

    for (const viewName of ['Tasks', 'Focus', 'Calendar'] as const) {
      await shell.getByRole('button', { name: viewName }).click();
      await expectNoHorizontalOverflow(page);
      for (const button of await page.getByTestId('workspace-content').locator('button:visible').all()) {
        const label = (await button.getAttribute('aria-label')) || (await button.textContent()) || 'button';
        expect((await button.boundingBox())?.height, `${viewName}: ${label.trim()}`).toBeGreaterThanOrEqual(
          44
        );
      }
    }

    await shell.getByRole('button', { name: 'More' }).click();
    await page.getByRole('dialog', { name: 'More' }).getByRole('button', { name: 'Analytics' }).click();
    await expect(page.getByTestId('mobile-analytics-view')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
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
