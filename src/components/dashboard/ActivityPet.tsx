import { useEffect, useState } from 'react';
import type { ActivityPetId } from '../../domain/types';
import { activityPetOptions } from '../../domain/activityPets';

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
  const spriteRow = streakActive ? activityIndex : 4;

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
      data-animated={streakActive && animated ? 'true' : 'false'}
      data-activity={activity}
      data-sprite-row={spriteRow}
      role="img"
      aria-label={`${definition.label} is ${activity}`}
      className="activity-pet ui-muted-chip grid size-9 shrink-0 place-items-center rounded-xl"
      title={`${definition.label}: ${activity}`}
    >
      <span
        data-testid="activity-pet-sprite"
        aria-hidden="true"
        className="activity-pet-sprite block size-8"
        style={{
          backgroundImage: `url(/pets/${definition.id}.svg)`,
          backgroundPositionY: `${spriteRow * -32}px`
        }}
      />
    </div>
  );
}
