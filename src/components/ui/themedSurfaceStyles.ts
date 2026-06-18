import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn';

export type ThemedSurfaceVariant = 'modal' | 'menu' | 'menuTrigger' | 'panel' | 'overlay';
export type ThemedSurfaceMaterial = 'control' | 'panel' | 'sidebar' | 'modal' | 'widget';

const themedSurfaceVariants = cva('', {
  variants: {
    variant: {
      modal: 'modal-surface themed-modal',
      menu: 'themed-menu',
      menuTrigger: 'themed-menu-trigger',
      panel: 'themed-panel',
      overlay: 'modal-overlay'
    }
  },
  defaultVariants: {
    variant: 'panel'
  }
});

export const themedSurfaceClassName = (variant: ThemedSurfaceVariant = 'panel', className?: string) =>
  cn(themedSurfaceVariants({ variant }), className);
