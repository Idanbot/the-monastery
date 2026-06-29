import { expect, test } from '@playwright/test';
import { normalizeTask } from '../src/domain/tasks';
import { api, expectStatus, resetServerState } from './helpers';

test('large board stays within render and interaction budgets', async ({ page, request }) => {
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

  const renderStarted = Date.now();
  await page.goto('/');
  const card = page.getByLabel(/Performance task 249, Backlog/i);
  await expect(card).toBeVisible();
  expect(Date.now() - renderStarted).toBeLessThan(8_000);

  const interactionStarted = Date.now();
  await card.getByRole('combobox', { name: /move performance task 249 to lane/i }).selectOption('done');
  await expect(page.getByTestId('board-column-done')).toContainText('Performance task 249');
  expect(Date.now() - interactionStarted).toBeLessThan(1_500);
});
