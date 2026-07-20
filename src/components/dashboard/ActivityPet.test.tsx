import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { activityPetManifests } from '../../domain/activityPets';
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
    expect(screen.getByTestId('activity-pet')).toHaveAttribute(
      'data-sprite-row',
      String(activityPetManifests.aurelius.animations.powered_idle.row)
    );
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
    expect(screen.getByTestId('activity-pet')).toHaveAttribute(
      'data-sprite-row',
      String(activityPetManifests.aurelius.animations.sleep.row)
    );
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-frame', '0');
  });

  it('keeps every pet atlas on the shared 16x16 contract with 16 animations', () => {
    for (const manifest of Object.values(activityPetManifests)) {
      expect(manifest).toMatchObject({ frameWidth: 128, frameHeight: 128, columns: 16, rows: 16 });
      expect(Object.keys(manifest.animations)).toHaveLength(16);
      for (const animation of Object.values(manifest.animations)) {
        expect(animation.row).toBeGreaterThanOrEqual(0);
        expect(animation.row).toBeLessThan(16);
        expect(animation.frameCount).toBeGreaterThan(0);
        expect(animation.frameCount).toBeLessThanOrEqual(16);
      }
    }
    expect(activityPetManifests.aurelius.animations.power_up).toMatchObject({
      loop: false,
      next: 'powered_idle'
    });
  });

  it('renders the kitten pet with its own atlas', () => {
    render(<ActivityPet petId="kitten" streakActive />);

    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-pet-id', 'kitten');
    expect(screen.getByTestId('activity-pet-sprite')).toHaveStyle({
      backgroundImage: 'url(/pets/kitten/kitten-spritesheet.png)'
    });
  });

  it('returns to the persistent loop after a one-shot reaction', () => {
    vi.useFakeTimers();
    render(<ActivityPet petId="aurelius" streakActive reaction="streak-started" />);

    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-animation', 'power_up');
    act(() =>
      vi.advanceTimersByTime(activityPetManifests.aurelius.animations.power_up.frameCount * (1000 / 16))
    );
    expect(screen.getByTestId('activity-pet')).toHaveAttribute('data-animation', 'powered_idle');
  });
});
