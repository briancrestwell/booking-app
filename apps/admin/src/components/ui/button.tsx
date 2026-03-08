import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // base — large tap target (min 44 px), bold, no radius issues on iOS
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ' +
  'ring-offset-background transition-all duration-100 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
  'disabled:pointer-events-none disabled:opacity-40 ' +
  'active:scale-95',
  {
    variants: {
      variant: {
        default:     'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:     'border border-border bg-transparent text-foreground hover:bg-accent',
        secondary:   'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:       'hover:bg-accent hover:text-accent-foreground text-foreground',
        link:        'text-primary underline-offset-4 hover:underline',
        // POS-specific
        success:  'bg-pos-green text-white hover:bg-pos-green/90',
        warning:  'bg-pos-amber text-white hover:bg-pos-amber/90',
      },
      size: {
        default: 'h-11 px-5 py-2.5',   // 44 px — iOS HIG minimum
        sm:      'h-9  px-4 rounded-lg text-xs',
        lg:      'h-14 px-6 text-base', // comfortable for one-handed use
        icon:    'h-11 w-11',
        'icon-lg': 'h-14 w-14',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
