import { useEffect, useState } from 'react';
import { Bird, Cat, Rabbit } from 'lucide-react';
import type { ActivityPetId } from '../../domain/types';
import { activityPetOptions } from '../../domain/activityPets';

const petIcons = { cat: Cat, owl: Bird, rabbit: Rabbit } as const;

const activeActivities = ['idle', 'look', 'stretch', 'celebrate'] as const;

export function ActivityPet({
  petId,
  streakActive,
  animated = true
}: {
  petId: ActivityPetId;
  streakActive: boolean;
  animated?: boolean;
}) {
  const [activityIndex, setActivityIndex] = useState(0);
  const definition = activityPetOptions.find((candidate) => candidate.id === petId) || activityPetOptions[0];
  const activity = streakActive ? activeActivities[activityIndex] : 'sleepy';
  const Icon = petIcons[definition.id];

  useEffect(() => {
    if (!streakActive || !animated) return;
    let timeout = 0;
    const scheduleNextActivity = () => {
      timeout = window.setTimeout(
        () => {
          setActivityIndex((current) => {
            const offset = 1 + Math.floor(Math.random() * (activeActivities.length - 1));
            return (current + offset) % activeActivities.length;
          });
          scheduleNextActivity();
        },
        4500 + Math.floor(Math.random() * 3500)
      );
    };
    scheduleNextActivity();
    return () => window.clearTimeout(timeout);
  }, [animated, streakActive]);

  return (
    <div
      data-testid="activity-pet"
      data-pet-id={definition.id}
      data-streak-active={streakActive ? 'true' : 'false'}
      data-activity={activity}
      data-sprite-row={streakActive ? activityIndex : 4}
      role="img"
      aria-label={`${definition.label} is ${activity}`}
      className="activity-pet ui-muted-chip grid size-9 shrink-0 place-items-center rounded-xl text-[var(--ui-info)]"
      title={`${definition.label}: ${activity}`}
    >
      <Icon className="activity-pet-icon" size={20} aria-hidden="true" />
    </div>
  );
}
