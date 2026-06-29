import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../domain/tasks';
import { MobileBoardControls } from './MobileBoardControls';

describe('MobileBoardControls', () => {
  it('changes layout and exposes ordering only when requested', () => {
    const setSettings = vi.fn();
    render(<MobileBoardControls settings={defaultSettings} setSettings={setSettings} />);

    expect(screen.queryByLabelText(/compact active top lane/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/mobile board layout/i), { target: { value: 'full' } });
    expect(setSettings).toHaveBeenCalledWith(expect.any(Function));

    fireEvent.click(screen.getByRole('button', { name: /customize lane order/i }));
    expect(screen.getByLabelText(/compact active top lane/i)).toBeInTheDocument();
  });
  it('enables the touch-friendly mobile focus view', () => {
    const setSettings = vi.fn();
    render(<MobileBoardControls settings={defaultSettings} setSettings={setSettings} />);

    fireEvent.click(screen.getByRole('button', { name: /use focused mobile view/i }));
    const update = setSettings.mock.lastCall?.[0];
    expect(update(defaultSettings)).toEqual({ ...defaultSettings, mobileFocusMode: true });
  });
});
