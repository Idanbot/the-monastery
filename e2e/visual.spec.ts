import { expect, test } from '@playwright/test';

const api = (path: string) => `http://127.0.0.1:3100${path}`;

const expectStatus = async (response, expectedStatus: number) => {
  if (response.status() !== expectedStatus) {
    throw new Error(`${response.url()} ${response.status()}: ${await response.text()}`);
  }
};

const resetServerState = async (request) => {
  const createdResponse = await request.post(api('/api/profiles'), {
    data: { name: `Visual ${Date.now()}` }
  });
  await expectStatus(createdResponse, 201);
  const created = await createdResponse.json();
  const activeProfile = created.profile;

  await request.post(api(`/api/profiles/${activeProfile.id}/reset`));
  const settingsResponse = await request.put(api(`/api/profiles/${activeProfile.id}/settings`), {
    data: {
      settings: {
        theme: 'system',
        visualTheme: 'zen',
        monkMode: false,
        animationsEnabled: false,
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

  return activeProfile.id;
};

const createTask = async (page, title: string) => {
  await page.getByLabel('New task').click();
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: /save task/i }).click();
};

const openSettingsSection = async (page, sectionName: string | RegExp) => {
  await page.getByRole('button', { name: /open settings/i }).click();
  await page.getByRole('button', { name: sectionName }).click();
};

const chooseTheme = async (page, themeId: string) => {
  await page.locator(`[data-theme-card="${themeId}"]`).click();
};

const completeBreathingIntro = async (page) => {
  const skipIntro = page.getByRole('button', { name: /skip breathing intro/i });
  if ((await skipIntro.count()) > 0 && (await skipIntro.first().isVisible())) {
    await skipIntro.first().click();
  }
};

const stabilizePage = async (page) => {
  await page.addStyleTag({
    content:
      '* { caret-color: transparent !important; } .sonner-toast, [data-sonner-toaster] { display: none !important; }'
  });
};

const screenshotOptions = { animations: 'disabled' as const, caret: 'hide' as const };

test.beforeEach(async ({ page, request }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  const activeProfileId = await resetServerState(request);
  await page.addInitScript((profileId) => {
    localStorage.clear();
    localStorage.setItem('the-monastery_active_profile_id_v1', profileId);
  }, activeProfileId);
});

test('theme gallery remains visually stable', async ({ page }) => {
  await page.goto('/');
  await stabilizePage(page);
  await openSettingsSection(page, 'Appearance');
  await expect(page.getByTestId('theme-gallery')).toHaveScreenshot('theme-gallery.png', screenshotOptions);
});

test('settings modal and Liquid Glass settings remain visually stable', async ({ page }) => {
  await page.goto('/');
  await stabilizePage(page);
  await openSettingsSection(page, 'Appearance');
  await expect(page.getByRole('dialog', { name: /preferences/i })).toHaveScreenshot(
    'settings-modal.png',
    screenshotOptions
  );
  await chooseTheme(page, 'liquid-glass');
  await expect(page.getByRole('dialog', { name: /preferences/i })).toHaveScreenshot(
    'settings-liquid-glass.png',
    screenshotOptions
  );
});

test('monk mode focus surface remains visually stable', async ({ page }) => {
  await page.goto('/');
  await stabilizePage(page);
  await createTask(page, 'Visual focus task');
  await page.keyboard.press('m');
  await completeBreathingIntro(page);
  await expect(page.getByTestId('monk-mode-view')).toHaveScreenshot('monk-mode.png', screenshotOptions);
});

test('mobile task board remains visually stable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await stabilizePage(page);
  await createTask(page, 'Mobile visual task');
  await expect(page.locator('.app-main')).toHaveScreenshot('mobile-board.png', screenshotOptions);
});
