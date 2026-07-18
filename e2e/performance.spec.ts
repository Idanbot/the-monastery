import { expect, test } from './fixtures';
import { normalizeTask } from '../src/domain/tasks';
import { api, expectStatus, openBoard, resetServerState } from './helpers';

const concurrentRenderBudgetMs = 12_000;

test('large board stays within render budget and supports lane movement', async ({ page, request }) => {
  test.setTimeout(60_000);
  const profileId = await resetServerState(request, {
    profilePrefix: 'Performance',
    animationsEnabled: false
  });
  const tasks = Array.from({ length: 250 }, (_, index) =>
    normalizeTask({ id: `perf-${index}`, title: `Performance task ${index}`, status: 'backlog' })
  );
  const response = await request.put(api(`/api/profiles/${profileId}/tasks`), { data: { tasks } });
  await expectStatus(response, 200);
  await page.addInitScript((activeProfileId) => {
    localStorage.clear();
    localStorage.setItem('the-monastery_active_profile_id_v1', activeProfileId);
  }, profileId);

  const mainRenderStarted = Date.now();
  await page.goto('/');
  await expect(page.getByTestId('main-workspace')).toBeVisible();
  expect(Date.now() - mainRenderStarted).toBeLessThan(concurrentRenderBudgetMs);

  const boardRenderStarted = Date.now();
  await openBoard(page);
  await expect(page.getByTestId('kanban-board')).toBeVisible();
  expect(Date.now() - boardRenderStarted).toBeLessThan(concurrentRenderBudgetMs);

  const card = page.getByLabel(/Performance task 249, Backlog/i);
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();

  await card
    .getByRole('combobox', { name: /move performance task 249 to lane/i })
    .selectOption('in-progress');
  await expect(page.getByTestId('board-column-in-progress')).toContainText('Performance task 249');
});
