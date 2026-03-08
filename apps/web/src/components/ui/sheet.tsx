'use client';
import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]',
      'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-in',
      className,
    )}
    ref={ref}
    {...props}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
    side?: 'bottom' | 'top';
  }
>(({ side = 'bottom', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        /* Base */
        'fixed z-50 bg-background shadow-2xl',
        'outline-none focus:outline-none',
        /* Max width — centred on large screens, edge-to-edge on mobile */
        'mx-auto max-w-md left-0 right-0',
        /* Bottom sheet */
        side === 'bottom' && [
          'bottom-0',
          'rounded-t-[1.5rem]',
          'data-[state=open]:animate-slide-up',
          /* Max height leaves a sliver of backdrop visible */
          'max-h-[92dvh]',
          'overflow-y-auto overflow-x-hidden',
          /* Momentum scroll on iOS */
          '[overflow-y:scroll]',
          '[-webkit-overflow-scrolling:touch]',
        ],
        className,
      )}
      {...props}
    >
      {/* Drag pill */}
      <div className="sticky top-0 z-10 flex justify-center bg-background pt-3 pb-1">
        <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
      </div>
      {children}
      {/* Safe-area bottom spacer */}
      <div className="pb-safe" />
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col px-5 pb-2 pt-2', className)} {...props} />
);

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('text-[17px] font-semibold leading-tight tracking-tight', className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetPortal };
