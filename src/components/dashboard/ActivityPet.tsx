import { useEffect, useMemo, useState } from 'react';
import {
  activityPetEventAnimations,
  activityPetManifests,
  activityPetStateAnimations,
  resolveActivityPetState,
  type ActivityPetAnimationName,
  type ActivityPetEvent
} from '../../domain/activityPets';
import type { ActivityPetId } from '../../domain/types';

type ActivityPetProps = {
  petId: ActivityPetId;
  streakActive: boolean;
  activityScore?: number;
  animated?: boolean;
  reaction?: ActivityPetEvent | null;
};

export function ActivityPet({
  petId,
  streakActive,
  activityScore = streakActive ? 100 : 0,
  animated = true,
  reaction = null
}: ActivityPetProps) {
  const definition = activityPetManifests[petId] ?? activityPetManifests.aurelius;
  const petState = resolveActivityPetState(activityScore, streakActive);
  const persistentAnimation = activityPetStateAnimations[petState];
  const [reactionAnimation, setReactionAnimation] = useState<ActivityPetAnimationName | null>(null);
  const animationName = reactionAnimation || persistentAnimation;
  const animation = definition.animations[animationName];
  const [frame, setFrame] = useState(0);
  const [atlasStatus, setAtlasStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animated && pageVisible && !reducedMotion;

  useEffect(() => {
    setReactionAnimation(reaction ? activityPetEventAnimations[reaction] : null);
  }, [reaction]);

  useEffect(() => {
    setFrame(0);
  }, [animationName]);

  useEffect(() => {
    if (!shouldAnimate) setFrame(0);
  }, [shouldAnimate]);

  useEffect(() => {
    let active = true;
    const image = new Image();
    const reveal = () => {
      const decoded = image.decode?.();
      if (!decoded) {
        if (active) setAtlasStatus('loaded');
        return;
      }
      void decoded
        .catch(() => undefined)
        .then(() => {
          if (active) setAtlasStatus('loaded');
        });
    };
    const fail = () => {
      if (active) setAtlasStatus('error');
    };
    image.addEventListener('load', reveal);
    image.addEventListener('error', fail);
    image.src = definition.src;
    if (image.complete && image.naturalWidth > 0) reveal();
    return () => {
      active = false;
      image.removeEventListener('load', reveal);
      image.removeEventListener('error', fail);
    };
  }, [definition.src]);

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    if (!shouldAnimate || animation.frameCount <= 1) return;
    const interval = window.setInterval(() => {
      setFrame((current) => {
        const next = current + 1;
        if (next < animation.frameCount) return next;
        if (animation.loop) return 0;
        setReactionAnimation(null);
        return 0;
      });
    }, 1000 / animation.fps);
    return () => window.clearInterval(interval);
  }, [animation, shouldAnimate]);

  const backgroundPosition = useMemo(() => {
    const x = (frame / (definition.columns - 1)) * 100;
    const y = (animation.row / (definition.rows - 1)) * 100;
    return `${x}% ${y}%`;
  }, [animation.row, definition.columns, definition.rows, frame]);

  return (
    <div
      data-testid="activity-pet"
      data-pet-id={petId}
      data-pet-state={petState}
      data-animation={animationName}
      data-streak-active={streakActive ? 'true' : 'false'}
      data-animated={shouldAnimate ? 'true' : 'false'}
      data-sprite-row={animation.row}
      data-frame={frame}
      data-atlas-loaded={atlasStatus === 'loaded' ? 'true' : 'false'}
      data-atlas-status={atlasStatus}
      role="img"
      aria-label={`${definition.label} is ${petState}`}
      className="activity-pet activity-pet-frame relative size-14 shrink-0 overflow-hidden rounded-md sm:size-20"
      title={`${definition.label}: ${animationName.replaceAll('_', ' ')}`}
    >
      <span
        data-testid="activity-pet-sprite"
        aria-hidden="true"
        className={`activity-pet-sprite absolute inset-0 block size-full transition-opacity ${
          atlasStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url(${definition.src})`,
          backgroundSize: `${definition.columns * 100}% ${definition.columns * 100}%`,
          backgroundPosition
        }}
      />
    </div>
  );
}

function useReducedMotion() {
  const mediaQuery = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => window.matchMedia?.(mediaQuery).matches ?? false);

  useEffect(() => {
    const query = window.matchMedia?.(mediaQuery);
    if (!query) return;
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
