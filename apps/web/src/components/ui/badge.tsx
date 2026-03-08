import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary',
        pending: 'bg-orange-100 text-orange-600',
        confirmed: 'bg-green-100 text-green-700',
        preparing: 'bg-blue-100 text-blue-700',
        ready: 'bg-emerald-100 text-emerald-700',
        served: 'bg-gray-100 text-gray-500',
        cancelled: 'bg-red-100 text-red-600',
        outline: 'border border-current bg-transparent',
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
