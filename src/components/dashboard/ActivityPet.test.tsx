import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aureliusPetManifest } from '../../domain/activityPets';
import { ActivityPet } from './ActivityPet';

describe('ActivityPet', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders Aurelius in a frame and advances the powered streak animation', () => {
    vi.useFakeTimers();
    const { rerender } = render(<ActivityPet petId="aurelius" streakActive />);

    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-pet-state', 'powered');
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-animation', 'powered_idle');
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-sprite-row', '14');
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-source-row', '13');
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-source-y', '1050');
    expect(screen.getByTestId('activity-pet-sprite')).toHaveStyle({
      backgroundImage: 'url(/pets/aurelius/aurelius-spritesheet.png)',
      backgroundSize: '1600% 1600%'
    });
    expect(screen.getByTestId('activity-pet-sprite')).toHaveAttribute('aria-hidden', 'true');
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-frame', '1');

    rerender(<ActivityPet petId="aurelius" streakActive animated={false} />);
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-frame', '0');

    rerender(<ActivityPet petId="aurelius" streakActive={false} activityScore={0} />);
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-pet-state', 'dormant');
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-animation', 'sleep');
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-sprite-row', '5');
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-frame', '0');
  });

  it('keeps all Aurelius frame ranges in a data-driven 16-row manifest', () => {
    expect(aureliusPetManifest).toMatchObject({
      frameWidth: 128,
      frameHeight: 128,
      columns: 16,
      rows: 16,
      sourceRows: 15
    });
    expect(Object.keys(aureliusPetManifest.animations)).toHaveLength(16);
    expect(aureliusPetManifest.animations.power_up).toMatchObject({
      row: 13,
      sourceRow: 12,
      sourceY: 971,
      frameCount: 14,
      loop: false,
      next: 'powered_idle'
    });
  });

  it('returns to the persistent loop after a one-shot reaction', () => {
    vi.useFakeTimers();
    render(<ActivityPet petId="aurelius" streakActive reaction="streak-started" />);

    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-animation', 'power_up');
    act(() => vi.advanceTimersByTime(14 * (1000 / 16)));
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-animation', 'powered_idle');
  });
});
