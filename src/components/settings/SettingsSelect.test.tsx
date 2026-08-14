import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsSelect } from './SettingsSelect';

vi.mock('../../contexts/SettingsContext', () => ({
  useSettingsContext: () => ({
    settings: { visualTheme: 'zen' },
    isDarkMode: false
  })
}));

vi.mock('../../hooks/useThemeStyle', () => ({
  useThemeStyle: () => ({
    animationsEnabled: false,
    themeStyle: {},
    modalEffectStyle: {}
  })
}));

describe('SettingsSelect', () => {
  it('mounts a large option collection only while its menu is open', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const options = Array.from({ length: 500 }, (_, index) => ({
      id: `tag-${index}`,
      label: `Tag ${index}`
    }));

    render(
      <SettingsSelect ariaLabel="Manage tag" value="tag-0" onValueChange={onValueChange} options={options} />
    );

    expect(screen.queryByRole('option', { name: 'Tag 499' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Manage tag' }));
    expect(screen.getByRole('option', { name: 'Tag 499' })).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Tag 499' }));
    expect(onValueChange).toHaveBeenCalledWith('tag-499');
    expect(screen.queryByRole('option', { name: 'Tag 499' })).not.toBeInTheDocument();
  }, 20_000);

  it('groups related options without changing selection behavior', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <SettingsSelect
        ariaLabel="Activity pet"
        value="aurelius"
        onValueChange={onValueChange}
        options={[
          { id: 'aurelius', label: 'Aurelius', group: 'Thinkers' },
          { id: 'socrates', label: 'Socrates', group: 'Thinkers' },
          { id: 'raven', label: 'Raven', group: 'Creatures' }
        ]}
      />
    );

    await user.click(screen.getByRole('combobox', { name: 'Activity pet' }));
    expect(screen.getByText('Thinkers')).toBeInTheDocument();
    expect(screen.getByText('Creatures')).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Raven' }));
    expect(onValueChange).toHaveBeenCalledWith('raven');
  });
});
