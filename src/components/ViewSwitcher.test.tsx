import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ViewSwitcher } from './ViewSwitcher';
import { TaskSearchInput } from './TaskSearchInput';

describe('ViewSwitcher', () => {
  it('renders nothing when disabled', () => {
    const { container } = render(<ViewSwitcher view="board" onChange={() => {}} disabled />);
    expect(container).toBeEmptyDOMElement();
  });

  it('calls onChange when the desktop Board button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ViewSwitcher view="dashboard" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /board/i }));
    expect(onChange).toHaveBeenCalledWith('board');
  });

  it('calls onChange when the mobile select changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ViewSwitcher view="board" onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText(/current view/i), 'dashboard');
    expect(onChange).toHaveBeenCalledWith('dashboard');
  });
});

describe('TaskSearchInput', () => {
  it('renders nothing when disabled', () => {
    const { container } = render(<TaskSearchInput value="" onChange={() => {}} variant="header" disabled />);
    expect(container).toBeEmptyDOMElement();
  });

  it('reports changes and clears on the clear button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TaskSearchInput value="python" onChange={onChange} variant="inline" />);

    await user.click(screen.getByTitle(/clear search/i));
    expect(onChange).toHaveBeenCalledWith('');
  });
});
