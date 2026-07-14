import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VisualSystemPreview } from './VisualSystemPreview';

describe('VisualSystemPreview', () => {
  it('shows the reusable text, control, and status hierarchy', () => {
    render(<VisualSystemPreview />);

    expect(screen.getByRole('heading', { name: 'Interface preview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Primary action preview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Secondary action preview' })).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Attention')).toBeInTheDocument();
  });
});
