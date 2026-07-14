import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const buttonVariants = cva(
  'ui-focus-ring inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-[background-color,color,border-color,transform] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'ui-accent-button',
        secondary: 'ui-control',
        ghost:
          'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-control)] hover:text-[var(--ui-text-primary)]',
        danger: 'text-[var(--ui-danger)] hover:bg-[color-mix(in_srgb,var(--ui-danger)_8%,transparent)]'
      },
      size: {
        sm: 'px-2.5 py-1.5 text-xs',
        md: 'px-3 py-2',
        lg: 'min-h-11 px-4 py-2.5 text-base',
        icon: 'h-8 w-8 p-0'
      }
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md'
    }
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
