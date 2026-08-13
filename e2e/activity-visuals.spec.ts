import type { APIRequestContext, Locator, Page, TestInfo } from '@playwright/test';
import { normalizeTask } from '../src/domain/tasks';
import { expect, test } from './fixtures';
import { api, expectStatus, resetServerState } from './helpers';

const seedActiveStreak = async (request: APIRequestContext, profileId: string) => {
  const end = Date.now() - 1_000;
  const completedAt = new Date(end).toISOString();
  const task = normalizeTask({
    id: 'activity-visual-task',
    title: 'Validate the activity visuals',
    status: 'done',
    createdAt: completedAt,
    logs: [{ start: new Date(end - 25 * 60_000).toISOString(), end: completedAt }],
    activity: [
      {
        id: 'activity-visual-complete',
        type: 'system',
        kind: 'task-completed',
        text: 'Marked done',
        timestamp: completedAt
      }
    ]
  });
  const response = await request.put(api(`/api/profiles/${profileId}/tasks`), {
    data: { tasks: [task] }
  });
  await expectStatus(response, 200);
};

const readFlamePixels = (canvas: Locator) =>
  canvas.evaluate((node: HTMLCanvasElement) => {
    const context =
      (node.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (node.getContext('webgl') as WebGLRenderingContext | null);
    if (!context) return { visiblePixels: 0, hash: 0 };
    const pixels = new Uint8Array(node.width * node.height * 4);
    context.finish();
    context.readPixels(0, 0, node.width, node.height, context.RGBA, context.UNSIGNED_BYTE, pixels);
    let visiblePixels = 0;
    let hash = 2166136261;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] > 8) visiblePixels++;
      hash ^= pixels[index] + pixels[index + 1] * 3 + pixels[index + 2] * 7 + pixels[index + 3] * 11;
      hash = Math.imul(hash, 16777619);
    }
    return { visiblePixels, hash: hash >>> 0 };
  });

const expectActivityToFitWithoutInnerScrolling = async (activity: Locator) => {
  const layout = await activity.evaluate((surface) => {
    const surfaceBounds = surface.getBoundingClientRect();
    const innerScrollers = [surface, ...surface.querySelectorAll('*')]
      .filter((element) => {
        const styles = getComputedStyle(element);
        return [styles.overflowX, styles.overflowY].some((value) => value === 'auto' || value === 'scroll');
      })
      .map((element) => ({
        className: element.className,
        testId: element.getAttribute('data-testid')
      }));
    const outsideSurface = ['activity-pet', 'activity-days'].filter((testId) => {
      const element = surface.querySelector(`[data-testid="${testId}"]`);
      if (!element) return true;
      const bounds = element.getBoundingClientRect();
      return (
        bounds.left < surfaceBounds.left - 1 ||
        bounds.right > surfaceBounds.right + 1 ||
        bounds.top < surfaceBounds.top - 1 ||
        bounds.bottom > surfaceBounds.bottom + 1
      );
    });

    const contentOverflow =
      surface.scrollWidth > surface.clientWidth + 1 || surface.scrollHeight > surface.clientHeight + 1;

    return { contentOverflow, innerScrollers, outsideSurface };
  });

  expect(layout.contentOverflow).toBe(false);
  expect(layout.innerScrollers).toEqual([]);
  expect(layout.outsideSurface).toEqual([]);
};

const expectEveryActivityRangeToFit = async (page: Page) => {
  const activity = page.getByRole('region', { name: 'Activity' });
  for (const name of ['Show 4 weeks', 'Show 3 months', 'Show 1 year']) {
    await page.getByRole('button', { name }).click();
    await expectActivityToFitWithoutInnerScrolling(activity);
  }
};

const verifyActivityVisuals = async (page: Page, testInfo: TestInfo, expectedPetSize: number) => {
  const flame = page.getByTestId('streak-flame');
  const canvas = page.getByTestId('streak-flame-canvas');
  const pet = page.getByTestId('activity-pet');
  const activityDays = page.getByTestId('activity-days');
  const activityMetrics = page.getByTestId('activity-metrics');

  await expect(flame).toHaveAttribute('data-renderer', 'ready', { timeout: 15_000 });
  await expect(canvas).toHaveAttribute('data-flame-ready', 'true');
  await expect(pet).toHaveAttribute('data-atlas-loaded', 'true', { timeout: 15_000 });
  await expect(pet).toHaveCSS('width', `${expectedPetSize}px`);
  await expect(pet).toHaveCSS('height', `${expectedPetSize}px`);
  await expect(canvas).toHaveCSS('pointer-events', 'none');
  await expectActivityToFitWithoutInnerScrolling(activityMetrics.locator('..'));
  expect(await activityMetrics.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  const metricRows = await activityMetrics
    .locator(':scope > *')
    .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().y));
  expect(Math.max(...metricRows) - Math.min(...metricRows)).toBeLessThanOrEqual(1);

  const firstFrame = await readFlamePixels(canvas);
  await page.waitForTimeout(180);
  const secondFrame = await readFlamePixels(canvas);
  expect(firstFrame.visiblePixels).toBeGreaterThan(40);
  expect(secondFrame.visiblePixels).toBeGreaterThan(40);
  expect(secondFrame.hash).not.toBe(firstFrame.hash);

  const [flameBox, petBox, activityDaysBox] = await Promise.all([
    flame.boundingBox(),
    pet.boundingBox(),
    activityDays.boundingBox()
  ]);
  expect(flameBox).not.toBeNull();
  expect(petBox).not.toBeNull();
  expect(activityDaysBox).not.toBeNull();
  expect(petBox!.x + petBox!.width).toBeLessThanOrEqual(activityDaysBox!.x);
  expect(
    Math.abs(petBox!.y + petBox!.height / 2 - (activityDaysBox!.y + activityDaysBox!.height / 2))
  ).toBeLessThanOrEqual(1);
  const overlaps =
    flameBox!.x < petBox!.x + petBox!.width &&
    flameBox!.x + flameBox!.width > petBox!.x &&
    flameBox!.y < petBox!.y + petBox!.height &&
    flameBox!.y + flameBox!.height > petBox!.y;
  expect(overlaps).toBe(false);

  await testInfo.attach(`three-flame-${expectedPetSize}px.png`, {
    body: await flame.screenshot(),
    contentType: 'image/png'
  });
  await testInfo.attach(`aurelius-${expectedPetSize}px.png`, {
    body: await pet.screenshot(),
    contentType: 'image/png'
  });
};

test('desktop activity renders a live Three.js flame and framed Aurelius pet', async ({
  page,
  request
}, testInfo) => {
  const profileId = await resetServerState(request, {
    profilePrefix: 'Desktop activity visuals',
    animationsEnabled: true
  });
  await seedActiveStreak(request, profileId);
  await page.addInitScript((activeProfileId) => {
    localStorage.clear();
    localStorage.setItem('the-monastery_active_profile_id_v1', activeProfileId);
  }, profileId);

  await page.goto('/');
  await expect(page.getByTestId('main-activity-module')).toBeVisible();
  await verifyActivityVisuals(page, testInfo, 80);
  await expectEveryActivityRangeToFit(page);

  await page.getByRole('button', { name: 'Customize main view' }).click();
  const petSelect = page.getByRole('combobox', { name: 'Activity pet' });
  await petSelect.click();
  const puppyOption = page.getByRole('option', { name: 'Puppy' });
  await expect(puppyOption).toBeVisible();
  expect(
    await puppyOption.evaluate((option) =>
      Number(getComputedStyle(option.closest('[role="listbox"]') as HTMLElement).zIndex)
    )
  ).toBe(130);
  expect(
    await puppyOption.evaluate((option) => {
      const bounds = option.getBoundingClientRect();
      return (
        document
          .elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)
          ?.closest('[role="option"]') === option
      );
    })
  ).toBe(true);
  await puppyOption.click();
  await expect(page.getByTestId('activity-pet')).toHaveAttribute('data-pet-id', 'puppy');
  await expect(page.getByTestId('activity-pet')).toHaveAttribute('data-atlas-loaded', 'true');
  await testInfo.attach('puppy-80px.png', {
    body: await page.getByTestId('activity-pet').screenshot(),
    contentType: 'image/png'
  });

  await petSelect.click();
  await page.getByRole('option', { name: 'Red Panda' }).click();
  await expect(page.getByTestId('activity-pet')).toHaveAttribute('data-pet-id', 'red-panda');
  await expect(page.getByTestId('activity-pet')).toHaveAttribute('data-atlas-loaded', 'true');
  await testInfo.attach('red-panda-80px.png', {
    body: await page.getByTestId('activity-pet').screenshot(),
    contentType: 'image/png'
  });

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Clear activity' }).click();
  await page.getByRole('button', { name: 'Close settings' }).click();
  await expect(page.getByTestId('activity-tracked-time')).toContainText('0s');
  await expect(page.getByTestId('activity-tasks-completed')).toContainText('0');
  await expect(page.getByTestId('streak-flame')).toHaveAttribute('data-animated', 'false');

  await expect
    .poll(async () => {
      const response = await page.request.get(api(`/api/profiles/${profileId}/settings`));
      await expectStatus(response, 200);
      return (await response.json()).settings.activityClearedBefore;
    })
    .toMatch(/^\d{4}-\d{2}-\d{2}T/);

  const settingsResponse = await page.request.get(api(`/api/profiles/${profileId}/settings`));
  await expectStatus(settingsResponse, 200);
  const savedSettings = (await settingsResponse.json()).settings;
  expect(savedSettings.activityPetId).toBe('red-panda');
  expect(new Date(savedSettings.activityClearedBefore).getTime()).toBeGreaterThan(0);
});

test('mobile activity keeps the live flame and pet framed without overlap', async ({
  page,
  request
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const profileId = await resetServerState(request, {
    profilePrefix: 'Mobile activity visuals',
    animationsEnabled: true
  });
  await seedActiveStreak(request, profileId);
  await page.addInitScript((activeProfileId) => {
    localStorage.clear();
    localStorage.setItem('the-monastery_active_profile_id_v1', activeProfileId);
  }, profileId);

  await page.goto('/');
  await page.getByTestId('mobile-shell').getByRole('button', { name: 'More' }).click();
  await page.getByRole('dialog', { name: 'More' }).getByRole('button', { name: 'Analytics' }).click();
  await verifyActivityVisuals(page, testInfo, 56);
  await expectEveryActivityRangeToFit(page);
});
