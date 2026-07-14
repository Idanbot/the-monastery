import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OneBreath } from './OneBreath';

describe('OneBreath', () => {
  it('lets the user skip the intro without completing twice', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OneBreath onComplete={onComplete} />);

    expect(screen.getByText('Inhale deep')).toBeInTheDocument();
    const skip = screen.getByRole('button', { name: 'Skip breathing intro' });
    await user.click(skip);
    await user.click(skip);

    expect(onComplete).toHaveBeenCalledOnce();
  });
});
