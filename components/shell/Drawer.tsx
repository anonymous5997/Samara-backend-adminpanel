'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible title; also rendered as the drawer heading. */
  title: string;
  /** Optional small label shown beside the title (e.g. item count). */
  meta?: ReactNode;
  side?: 'left' | 'right';
  children: ReactNode;
  /** Sticky footer area (totals, CTAs). */
  footer?: ReactNode;
  className?: string;
}

/**
 * Storefront drawer: backdrop fade + panel slide (see .sm-drawer-* in
 * globals.css). Children can stagger in with .sm-stagger + style={{'--i': n}}.
 * Built on Radix Dialog for focus trapping, Esc and scroll locking.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  meta,
  side = 'right',
  children,
  footer,
  className,
}: DrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="sm-drawer-overlay fixed inset-0 z-[1100] bg-black/60 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          data-side={side}
          aria-describedby={undefined}
          className={cn(
            'sm-drawer-panel fixed inset-y-0 z-[1101] flex w-full max-w-[440px] flex-col bg-samara-ink text-samara-ivory outline-none',
            side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
            'border-samara-line',
            className,
          )}
        >
          <header className="flex items-center justify-between px-6 py-5 md:px-8">
            <div className="flex items-baseline gap-3">
              <DialogPrimitive.Title className="font-serif text-2xl font-normal text-samara-ivory">
                {title}
              </DialogPrimitive.Title>
              {meta && <span className="sm-eyebrow">{meta}</span>}
            </div>
            <DialogPrimitive.Close
              className="-mr-2 flex h-10 w-10 items-center justify-center text-samara-mute transition-colors hover:text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={1.25} />
            </DialogPrimitive.Close>
          </header>
          <div className="sm-hairline" />

          <div className="flex-1 overflow-y-auto overscroll-contain px-6 md:px-8">
            {children}
          </div>

          {footer && (
            <div className="border-t border-samara-line px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-8">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
