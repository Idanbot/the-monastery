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

const verifyActivityVisuals = async (page: Page, testInfo: TestInfo, expectedPetSize: number) => {
  const flame = page.getByTestId('streak-flame');
  const canvas = page.getByTestId('streak-flame-canvas');
  const pet = page.getByTestId('activity-pet');

  await expect(flame).toHaveAttribute('data-renderer', 'ready', { timeout: 15_000 });
  await expect(canvas).toHaveAttribute('data-flame-ready', 'true');
  await expect(pet).toHaveAttribute('data-atlas-loaded', 'true', { timeout: 15_000 });
  await expect(pet).toHaveCSS('width', `${expectedPetSize}px`);
  await expect(pet).toHaveCSS('height', `${expectedPetSize}px`);
  await expect(canvas).toHaveCSS('pointer-events', 'none');

  const firstFrame = await readFlamePixels(canvas);
  await page.waitForTimeout(180);
  const secondFrame = await readFlamePixels(canvas);
  expect(firstFrame.visiblePixels).toBeGreaterThan(40);
  expect(secondFrame.visiblePixels).toBeGreaterThan(40);
  expect(secondFrame.hash).not.toBe(firstFrame.hash);

  const [flameBox, petBox] = await Promise.all([flame.boundingBox(), pet.boundingBox()]);
  expect(flameBox).not.toBeNull();
  expect(petBox).not.toBeNull();
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
});
