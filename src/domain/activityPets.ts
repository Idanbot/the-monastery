import type { ActivityPetId } from './types';

export type ActivityPetState = 'dormant' | 'calm' | 'engaged' | 'energized' | 'powered';
export type ActivityPetAnimationCategory = 'loop' | 'one-shot' | 'transition' | 'ambient';
export type ActivityPetAnimationName = keyof typeof aureliusAnimations;
export type ActivityPetEvent =
  | 'task-completed'
  | 'milestone-reached'
  | 'streak-started'
  | 'streak-lost'
  | 'user-returned';

// The supplied Aurelius export is packed unevenly despite its regular logical manifest.
// Explicit source offsets keep neighboring rows out of the fixed avatar frame.
const aureliusSourceRowY = [0, 98, 183, 268, 345, 410, 493, 575, 653, 731, 811, 891, 971, 1050, 1147];

const aureliusAnimations = {
  idle_breathe: animation(0, 0, 8, 6, true, 'loop', 10),
  idle_blink: animation(1, 1, 6, 8, false, 'ambient', 10),
  look_left_right: animation(2, 2, 8, 8, false, 'ambient', 10),
  idle_fidget: animation(3, 3, 8, 6, false, 'ambient', 10),
  yawn: animation(4, 4, 10, 8, false, 'ambient', 30),
  sleep: animation(5, 5, 8, 5, true, 'loop', 10),
  wake_up: animation(6, 6, 10, 10, false, 'transition', 100, 'idle_breathe'),
  streak_lost: animation(7, 7, 12, 10, false, 'transition', 95, 'idle_breathe'),
  ready_bounce: animation(8, 8, 8, 10, true, 'loop', 10),
  focused_idle: animation(9, 8, 8, 8, true, 'loop', 10),
  energized_bounce: animation(10, 9, 10, 12, true, 'loop', 10),
  small_success: animation(11, 10, 8, 12, false, 'one-shot', 70),
  big_success: animation(12, 11, 14, 14, false, 'one-shot', 90),
  power_up: animation(13, 12, 14, 16, false, 'transition', 100, 'powered_idle'),
  powered_idle: animation(14, 13, 8, 10, true, 'loop', 10),
  celebrate: animation(15, 14, 14, 14, false, 'one-shot', 85)
} as const;

function animation<Next extends string | undefined = undefined>(
  row: number,
  sourceRow: number,
  frameCount: number,
  fps: number,
  loop: boolean,
  category: ActivityPetAnimationCategory,
  priority: number,
  next?: Next
) {
  return {
    row,
    sourceRow,
    sourceY: aureliusSourceRowY[sourceRow],
    startFrame: 0,
    frameCount,
    fps,
    loop,
    category,
    priority,
    interruptible: priority < 90,
    ...(next ? { next } : {})
  } as const;
}

export const aureliusPetManifest = {
  id: 'aurelius',
  label: 'Aurelius',
  src: '/pets/aurelius/aurelius-spritesheet.png',
  frameWidth: 128,
  frameHeight: 128,
  columns: 16,
  rows: 16,
  sourceRows: 15,
  sourceSize: 1254,
  pivot: { x: 64, y: 116 },
  animations: aureliusAnimations
} as const;

export const activityPetOptions = [
  { id: aureliusPetManifest.id, label: aureliusPetManifest.label }
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
