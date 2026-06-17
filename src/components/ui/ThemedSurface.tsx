import { forwardRef, type ElementType, type HTMLAttributes } from 'react';
import { themedSurfaceClassName, type ThemedSurfaceVariant } from './themedSurfaceStyles';

type ThemedSurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  variant?: ThemedSurfaceVariant;
  type?: 'button' | 'submit' | 'reset';
};

export const ThemedSurface = forwardRef<HTMLElement, ThemedSurfaceProps>(
  ({ as: Component = 'div', variant, className, ...props }, ref) => (
    <Component ref={ref} className={themedSurfaceClassName(variant, className)} {...props} />
  )
);

ThemedSurface.displayName = 'ThemedSurface';
