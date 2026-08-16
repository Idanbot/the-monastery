import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { resetAppTestState, seedSettings } from './test/appTestHarness';

beforeEach(resetAppTestState);

it('toggles seconds for the analog clock second hand', async () => {
  const user = userEvent.setup();
  seedSettings({ clockDisplayMode: 'analog', showSeconds: true });
  render(<App />);

  expect(screen.getByTestId('clock-second-hand')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /open clock settings/i }));
  await user.click(await screen.findByLabelText(/show seconds/i));

  expect(screen.queryByTestId('clock-second-hand')).not.toBeInTheDocument();
});

it('keeps clock color controls aligned with inherited theme text color', async () => {
  const user = userEvent.setup();
  seedSettings({
    visualTheme: 'liquid-glass',
    theme: 'light',
    colorScheme: { main: '#ff2d55', secondary: '#34c759', text: '#2c2c2e' },
    clockTextColor: ''
  });
  render(<App />);

  const clockWidget = screen.getByTestId('clock-time').closest('.clock-widget') as HTMLElement;
  expect(clockWidget.style.getPropertyValue('--clock-text-color')).toBe('#2c2c2e');

  await user.click(screen.getByRole('button', { name: /open clock settings/i }));
  expect(await screen.findByLabelText(/clock text color/i)).toHaveValue('#2c2c2e');
});

it('adds a role definition in settings', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));
  await user.click(await screen.findByRole('button', { name: /^roles$/i }));
  await user.click(await screen.findByRole('button', { name: /^add$/i }));
  expect(await screen.findByDisplayValue('New Role')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /close settings/i }));
  await user.click(screen.getByTestId('view-switch-dashboard'));

  const roleHours = (await screen.findByText(/role hours/i)).closest('section')!;
  expect(within(roleHours).getByText(/new role/i)).toBeInTheDocument();
}, 20_000);

it('opens full settings collapsed and supports icon-only expand/collapse controls', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));

  expect(await screen.findByRole('button', { name: /^appearance$/i })).toBeInTheDocument();
  expect(screen.queryByText(/modal transparency/i)).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /expand all settings sections/i }));
  expect(await screen.findByText(/modal transparency/i)).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: /backup/i })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /collapse all settings sections/i }));
  await waitFor(
    () => {
      expect(screen.queryByText(/modal transparency/i)).not.toBeInTheDocument();
    },
    { timeout: 3000 }
  );
}, 20_000);

it('offers readable theme gallery choices for default modes and custom themes', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));
  await user.click(await screen.findByRole('button', { name: /^appearance$/i }));
  await user.click(await screen.findByRole('button', { name: 'Terminal Themes' }));
  await user.click(screen.getByRole('button', { name: 'Dark Themes' }));

  const optionLabels = screen.getAllByTestId('theme-gallery-label').map((option) => option.textContent);

  expect(optionLabels).toEqual([
    'System Default',
    'Light',
    'Zen',
    'Liquid Glass',
    'GitHub Light',
    'Terminal',
    'Terminal White',
    'Dark',
    'Tokyo Night',
    'Obsidian Glass',
    'Catppuccin Mocha',
    'Gruvbox',
    'Dracula',
    'GitHub Dark',
    'Nord',
    'Night Owl'
  ]);
});

it('toggles the right container from the compact header', async () => {
  const user = userEvent.setup();
  render(<App />);

  expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /hide right container/i }));
  expect(screen.getByRole('button', { name: /show right container/i })).toBeInTheDocument();
});

it('shows an icon in the locate-current-time button', () => {
  render(<App />);

  const locateButton = screen.getByRole('button', { name: /locate current time/i });
  expect(locateButton.querySelector('svg')).toBeInTheDocument();
});

it('closes settings when clicking outside the modal surface', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));
  expect(screen.getByRole('heading', { name: /preferences/i })).toBeInTheDocument();

  fireEvent.mouseDown(screen.getByTestId('settings-modal-overlay'));

  expect(screen.queryByRole('heading', { name: /preferences/i })).not.toBeInTheDocument();
});

it('opens board settings as a scoped section only', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /board settings/i }));

  const dialog = screen.getByRole('dialog', { name: /preferences/i });
  expect(await within(dialog).findByRole('button', { name: /^board$/i })).toBeInTheDocument();
  expect(within(dialog).getByRole('combobox', { name: 'Board layout' })).toHaveTextContent(
    'Compact: 2 split columns'
  );
  expect(within(dialog).queryByRole('button', { name: /^appearance$/i })).not.toBeInTheDocument();
});

it('keeps comma-separated role tags editable while typing', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));
  await user.click(await screen.findByRole('button', { name: /^roles$/i }));
  await user.click(await screen.findByRole('button', { name: /^add$/i }));

  const tagsInput = screen.getByPlaceholderText(/python, docker, backend/i);
  await user.type(tagsInput, 'python, docker,');

  expect(tagsInput).toHaveValue('python, docker,');
});

it('adds role tags from the fuzzy tag pool', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));
  await user.click(await screen.findByRole('button', { name: /^roles$/i }));
  await user.click(await screen.findByRole('button', { name: /^add$/i }));
  await user.type(screen.getByRole('textbox', { name: /find tag/i }), 'dock');
  await user.click(screen.getByRole('button', { name: /^docker$/i }));

  expect(screen.getByPlaceholderText(/python, docker, backend/i)).toHaveValue('docker');
});

it('adds a customizable role preset in settings', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /open settings/i }));
  await user.click(await screen.findByRole('button', { name: /^roles$/i }));
  await user.click(await screen.findByRole('button', { name: /^preset$/i }));

  expect(screen.getAllByDisplayValue(/backend/i).length).toBeGreaterThan(0);
  const tagsInput = screen.getByPlaceholderText(/python, docker, backend/i);
  expect((tagsInput as HTMLInputElement).value).toContain('backend');

  await user.clear(tagsInput);
  await user.type(tagsInput, 'backend, graphql,');

  expect(tagsInput).toHaveValue('backend, graphql,');
});
