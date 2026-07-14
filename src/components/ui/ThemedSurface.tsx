import { forwardRef, type ElementType, type HTMLAttributes } from 'react';
import {
  themedSurfaceClassName,
  type ThemedSurfaceMaterial,
  type ThemedSurfaceVariant
} from './themedSurfaceStyles';

type ThemedSurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  variant?: ThemedSurfaceVariant;
  material?: ThemedSurfaceMaterial;
  type?: 'button' | 'submit' | 'reset';
};

export const ThemedSurface = forwardRef<HTMLElement, ThemedSurfaceProps>(
  ({ as: Component = 'div', variant = 'panel', material, className, ...props }, ref) => {
    const resolvedMaterial =
      material ??
      (variant === 'modal'
        ? 'modal'
        : variant === 'menu' || variant === 'menuTrigger'
          ? 'control'
          : undefined);

    return (
      <Component
        ref={ref}
        data-material={resolvedMaterial}
        data-surface={variant}
        className={themedSurfaceClassName(variant, className)}
        {...props}
      />
    );
  }
);

ThemedSurface.displayName = 'ThemedSurface';
