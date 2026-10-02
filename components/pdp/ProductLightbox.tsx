'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState, type MouseEvent, type PointerEvent } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Dialog, DialogClose, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { circleBtn, isOptimizable, pad2 } from './pdp-utils';

interface ProductLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: { id: string; image_url: string }[];
  index: number;
  onIndexChange: (index: number) => void;
  productName: string;
}

/**
 * Full-screen image viewer. Click / tap the photo to zoom 2x at that point;
 * move the pointer to pan; arrows (or the keyboard) step through photos.
 */
export function ProductLightbox({ open, onOpenChange, images, index, onIndexChange, productName }: ProductLightboxProps) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const count = images.length;
  const current = images[index];

  useEffect(() => {
    setZoomed(false);
  }, [index, open]);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (count < 2) return;
      onIndexChange((index + dir + count) % count);
    },
    [count, index, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go]);

  const setOriginFrom = (e: MouseEvent<HTMLElement> | PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${Math.min(100, Math.max(0, x))}% ${Math.min(100, Math.max(0, y))}%`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="sm-drawer-overlay z-[1100] bg-samara-black/[0.97]" />
        <DialogPrimitive.Content
          className="sm-drawer-overlay fixed inset-0 z-[1101] flex flex-col bg-samara-black text-samara-ivory outline-none"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">{productName}: photo viewer</DialogTitle>
          <DialogDescription className="sr-only">
            Use the arrow buttons or arrow keys to change photo. Select the photo to zoom.
          </DialogDescription>

          {/* Top bar */}
          <div className="sm-container flex h-[72px] shrink-0 items-center justify-between gap-4 pt-[env(safe-area-inset-top)]">
            <p className="flex min-w-0 items-center gap-3 font-sans text-[0.6875rem] tabular-nums tracking-[0.18em] text-samara-mute">
              <span className="text-samara-ivory">{pad2(index + 1)}</span>
              <span aria-hidden className="h-px w-8 bg-samara-mute/50" />
              <span>{pad2(count)}</span>
              <span className="ml-3 hidden truncate font-serif text-base italic tracking-normal text-samara-ivory/80 sm:inline">
                {productName}
              </span>
            </p>
            <DialogClose className={circleBtn} aria-label="Close photo viewer">
              <X aria-hidden className="h-4 w-4" strokeWidth={1.25} />
            </DialogClose>
          </div>

          {/* Photo */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {current && (
              <button
                type="button"
                aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
                aria-pressed={zoomed}
                onClick={(e) => {
                  setOriginFrom(e);
                  setZoomed((z) => !z);
                }}
                onPointerMove={(e) => zoomed && e.pointerType === 'mouse' && setOriginFrom(e)}
                className={cn(
                  'absolute inset-0 flex h-full w-full items-center justify-center focus-visible:outline-none',
                  zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in',
                )}
              >
                <span
                  style={{ transformOrigin: origin }}
                  className={cn(
                    'absolute inset-0 transition-transform duration-700 ease-editorial motion-reduce:transition-none',
                    zoomed ? 'scale-[2.2]' : 'scale-100',
                  )}
                >
                  <Image
                    key={current.id}
                    src={current.image_url}
                    alt={`${productName}, photo ${index + 1} of ${count}`}
                    fill
                    sizes="100vw"
                    draggable={false}
                    unoptimized={!isOptimizable(current.image_url)}
                    className="select-none object-contain"
                  />
                </span>
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="sm-container flex h-[88px] shrink-0 items-center justify-center gap-3 pb-[env(safe-area-inset-bottom)]">
            {count > 1 && (
              <>
                <button type="button" className={circleBtn} onClick={() => go(-1)} aria-label="Previous photo">
                  <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.25} />
                </button>
                <button type="button" className={circleBtn} onClick={() => go(1)} aria-label="Next photo">
                  <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.25} />
                </button>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
