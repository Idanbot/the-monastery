import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { resetServerState } from './helpers';

export const registerCleanAppState = () => {
  test.beforeEach(async ({ page, request }) => {
    const activeProfileId = await resetServerState(request);
    await page.addInitScript((profileId) => {
      localStorage.clear();
      localStorage.setItem('the-monastery_active_profile_id_v1', profileId);
    }, activeProfileId);
  });
};

export const expectNoHorizontalOverflow = async (page: Page) => {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
  ).toBe(true);
};
