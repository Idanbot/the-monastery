import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemedSurface } from './ThemedSurface';

describe('ThemedSurface', () => {
  it('gives every modal and overlay the shared dialog visual contract', () => {
    render(
      <>
        <ThemedSurface data-testid="overlay" variant="overlay" />
        <ThemedSurface data-testid="dialog" variant="modal" />
      </>
    );

    expect(screen.getByTestId('overlay')).toHaveClass('ui-dialog-overlay');
    expect(screen.getByTestId('dialog')).toHaveClass('ui-dialog-surface');
    expect(screen.getByTestId('dialog')).toHaveAttribute('data-material', 'modal');
  });
});
