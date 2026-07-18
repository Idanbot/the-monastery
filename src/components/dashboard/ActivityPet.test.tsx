import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActivityPet } from './ActivityPet';

describe('ActivityPet', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('cycles active streak activities and returns to a static sleepy state', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { rerender } = render(<ActivityPet petId="cat" streakActive />);

    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-activity', 'idle');
    act(() => vi.advanceTimersByTime(4500));
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-activity', 'look');

    rerender(<ActivityPet petId="cat" streakActive={false} />);
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-activity', 'sleepy');
  });
});
