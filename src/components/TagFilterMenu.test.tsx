import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TagFilterMenu } from './TagFilterMenu';

describe('TagFilterMenu', () => {
  it('searches known tags and selects the first autocomplete result with Enter', () => {
    const onToggleTag = vi.fn();
    render(
      <TagFilterMenu
        knownTags={['backend', 'observability', 'open-telemetry']}
        activeFilters={[]}
        onToggleTag={onToggleTag}
        onClear={vi.fn()}
      />
    );

    const search = screen.getByRole('combobox', { name: /search known tags/i });
    fireEvent.change(search, { target: { value: 'obs' } });
    expect(screen.getByRole('button', { name: 'observability' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'backend' })).not.toBeInTheDocument();

    fireEvent.keyDown(search, { key: 'Enter' });
    expect(onToggleTag).toHaveBeenCalledWith('observability');
  });

  it('clears active filters', () => {
    const onClear = vi.fn();
    render(
      <TagFilterMenu
        knownTags={['backend']}
        activeFilters={['backend']}
        onToggleTag={vi.fn()}
        onClear={onClear}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
