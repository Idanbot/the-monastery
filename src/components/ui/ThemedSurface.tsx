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
  ({ as: Component = 'div', variant, material, className, ...props }, ref) => (
    <Component
      ref={ref}
      data-material={material}
      className={themedSurfaceClassName(variant, className)}
      {...props}
    />
  )
);

ThemedSurface.displayName = 'ThemedSurface';
