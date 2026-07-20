import type { ActivityPetId } from './types';
import aureliusAtlas from './generated/aureliusAtlas.json';
import kittenAtlas from './generated/kittenAtlas.json';

export type ActivityPetState = 'dormant' | 'calm' | 'engaged' | 'energized' | 'powered';
export type ActivityPetAnimationCategory = 'loop' | 'one-shot' | 'transition' | 'ambient';
export const activityPetAnimationNames = [
  'idle_breathe',
  'idle_blink',
  'look_left_right',
  'idle_fidget',
  'yawn',
  'sleep',
  'wake_up',
  'streak_lost',
  'ready_bounce',
  'focused_idle',
  'energized_bounce',
  'small_success',
  'big_success',
  'power_up',
  'powered_idle',
  'celebrate'
] as const;
export type ActivityPetAnimationName = (typeof activityPetAnimationNames)[number];
export type ActivityPetEvent =
  | 'task-completed'
  | 'milestone-reached'
  | 'streak-started'
  | 'streak-lost'
  | 'user-returned';

export type ActivityPetAnimation = {
  row: number;
  frameCount: number;
  fps: number;
  loop: boolean;
  category: ActivityPetAnimationCategory;
  priority: number;
  interruptible: boolean;
  next?: ActivityPetAnimationName;
};

export type ActivityPetManifest = {
  id: ActivityPetId;
  label: string;
  src: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  animations: Record<ActivityPetAnimationName, ActivityPetAnimation>;
};

// Every pet atlas is normalized by scripts/normalize-pet-atlas.py into the
// same contract: a transparent 2048x2048 PNG, a 16x16 grid of 128x128 cells,
// one animation per row, frames compacted from column 0, and a shared
// bottom-center pivot. Frame windows can therefore use plain grid math and
// never see slices of neighboring sprites.
//
// The atlas URL carries a content-hash version query because the PWA service
// worker serves /pets/* cache-first: without it, a regenerated atlas keeps
// showing the stale cached sheet (misaligned frames, baked background) for
// weeks.
const animationBehavior = {
  idle_breathe: behavior(3, true, 'loop', 10),
  idle_blink: behavior(4, false, 'ambient', 10),
  look_left_right: behavior(4, false, 'ambient', 10),
  idle_fidget: behavior(3, false, 'ambient', 10),
  yawn: behavior(4, false, 'ambient', 30),
  sleep: behavior(2.5, true, 'loop', 10),
  wake_up: behavior(5, false, 'transition', 100, 'idle_breathe'),
  streak_lost: behavior(5, false, 'transition', 95, 'idle_breathe'),
  ready_bounce: behavior(5, true, 'loop', 10),
  focused_idle: behavior(4, true, 'loop', 10),
  energized_bounce: behavior(6, true, 'loop', 10),
  small_success: behavior(6, false, 'one-shot', 70),
  big_success: behavior(7, false, 'one-shot', 90),
  power_up: behavior(8, false, 'transition', 100, 'powered_idle'),
  powered_idle: behavior(5, true, 'loop', 10),
  celebrate: behavior(7, false, 'one-shot', 85)
} as const;

function behavior<Next extends ActivityPetAnimationName | undefined = undefined>(
  fps: number,
  loop: boolean,
  category: ActivityPetAnimationCategory,
  priority: number,
  next?: Next
) {
  return {
    fps,
    loop,
    category,
    priority,
    interruptible: priority < 90,
    ...(next ? { next } : {})
  } as const;
}

type GeneratedAtlas = {
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  version?: string;
  animations: Record<string, { row: number; frameCount: number }>;
};

function buildManifest(id: ActivityPetId, label: string, atlas: GeneratedAtlas): ActivityPetManifest {
  const animations = {} as Record<ActivityPetAnimationName, ActivityPetAnimation>;
  for (const [name, behaviorDef] of Object.entries(animationBehavior) as [
    ActivityPetAnimationName,
    (typeof animationBehavior)[ActivityPetAnimationName]
  ][]) {
    const layout = atlas.animations[name];
    if (!layout) throw new Error(`Atlas for ${id} is missing animation ${name}`);
    animations[name] = { ...behaviorDef, row: layout.row, frameCount: layout.frameCount };
  }
  return {
    id,
    label,
    src: `/pets/${id}/${id}-spritesheet.png?v=${atlas.version ?? '1'}`,
    frameWidth: atlas.frameWidth,
    frameHeight: atlas.frameHeight,
    columns: atlas.columns,
    rows: atlas.rows,
    animations
  };
}

export const activityPetManifests = {
  aurelius: buildManifest('aurelius', 'Aurelius', aureliusAtlas),
  kitten: buildManifest('kitten', 'Kitten', kittenAtlas)
} as const satisfies Record<ActivityPetId, ActivityPetManifest>;

export const activityPetOptions = [
  { id: 'aurelius', label: activityPetManifests.aurelius.label },
  { id: 'kitten', label: activityPetManifests.kitten.label }
] as const satisfies readonly { id: ActivityPetId; label: string }[];

export const activityPetEventAnimations = {
  'task-completed': 'small_success',
  'milestone-reached': 'big_success',
  'streak-started': 'power_up',
  'streak-lost': 'streak_lost',
  'user-returned': 'wake_up'
} as const satisfies Record<ActivityPetEvent, ActivityPetAnimationName>;

export function resolveActivityPetState(activityScore: number, streakActive: boolean): ActivityPetState {
  if (streakActive || activityScore >= 90) return 'powered';
  if (activityScore >= 70) return 'energized';
  if (activityScore >= 40) return 'engaged';
  if (activityScore >= 16) return 'calm';
  return 'dormant';
}

export const activityPetStateAnimations = {
  dormant: 'sleep',
  calm: 'idle_breathe',
  engaged: 'focused_idle',
  energized: 'energized_bounce',
  powered: 'powered_idle'
} as const satisfies Record<ActivityPetState, ActivityPetAnimationName>;
