import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { themeChoiceOptions } from '../../domain/themeGallery';
import { ThemeGallery } from './ThemeGallery';

describe('ThemeGallery', () => {
  it('presents large live previews and selects a theme from the gallery', async () => {
    const user = userEvent.setup();
    const setThemeChoice = vi.fn();
    render(
      <ThemeGallery
        options={themeChoiceOptions}
        normalizedThemeChoice="theme:liquid-glass"
        setThemeChoice={setThemeChoice}
      />
    );

    const glass = screen.getByRole('button', { name: 'Select Liquid Glass theme' });
    expect(within(glass).getByTestId('theme-card-preview')).toBeInTheDocument();
    expect(glass).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Select Zen theme' }));
    expect(setThemeChoice).toHaveBeenCalledWith('theme:zen');
  });

  it('collapses inactive groups until they are requested', async () => {
    const user = userEvent.setup();
    render(
      <ThemeGallery
        options={themeChoiceOptions}
        normalizedThemeChoice="theme:liquid-glass"
        setThemeChoice={vi.fn()}
      />
    );

    const darkThemes = screen.getByRole('button', { name: 'Dark Themes' });
    expect(darkThemes).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Select Nord theme' })).not.toBeInTheDocument();

    await user.click(darkThemes);
    expect(screen.getByRole('button', { name: 'Select Nord theme' })).toBeInTheDocument();
  });
});
