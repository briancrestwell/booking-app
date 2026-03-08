import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-primary text-primary-foreground',
        secondary:   'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline:     'text-foreground border-border',
        // Order / table status variants
        pending:    'border-transparent bg-status-preparing text-white',
        confirmed:  'border-transparent bg-pos-brand text-white',
        preparing:  'border-transparent bg-pos-amber text-white',
        ready:      'border-transparent bg-pos-green text-white',
        served:     'border-transparent bg-muted text-muted-foreground',
        cancelled:  'border-transparent bg-destructive/20 text-destructive',
        available:  'border-transparent bg-pos-green/20 text-pos-green',
        occupied:   'border-transparent bg-destructive/20 text-destructive',
        locked:     'border-transparent bg-pos-purple/20 text-pos-purple',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
