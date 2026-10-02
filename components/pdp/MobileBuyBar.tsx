'use client';

import { useEffect, useState, type RefObject } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { goldBtn } from './pdp-utils';

interface MobileBuyBarProps {
  productName: string;
  priceLabel: string;
  mrpLabel: string | null;
  adding: boolean;
  onAdd: () => void;
  /** The in-page CTA block: the bar shows once it has scrolled out of view. */
  ctaRef: RefObject<HTMLElement | null>;
  /** End of the product content: the bar hides again before the footer. */
  endRef: RefObject<HTMLElement | null>;
}

/** Sticky bottom bar (below lg): price + Add to Bag, safe-area aware. */
export function MobileBuyBar({ productName, priceLabel, mrpLabel, adding, onAdd, ctaRef, endRef }: MobileBuyBarProps) {
  const [shown, setShown] = useState(false);

  // Measured on scroll (not IntersectionObserver) so long jumps — e.g. back
  // to the top — are always caught.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const cta = ctaRef.current;
      const end = endRef.current;
      if (!cta || !end) return;
      const vh = window.innerHeight;
      const c = cta.getBoundingClientRect();
      const ctaVisible = c.bottom > 0 && c.top < vh;
      const reachedEnd = end.getBoundingClientRect().top < vh;
      setShown(!ctaVisible && !reachedEnd);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ctaRef, endRef]);

  return (
    <div
      aria-hidden={!shown}
      className={cn(
        'fixed inset-x-0 bottom-0 z-[900] border-t border-samara-line bg-samara-ink/95 backdrop-blur-md transition-transform duration-500 ease-editorial motion-reduce:transition-none lg:hidden',
        shown ? 'translate-y-0' : 'pointer-events-none translate-y-full',
      )}
    >
      <div className="sm-container flex items-center gap-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-[1.0625rem] font-normal leading-tight text-samara-ivory">{productName}</p>
          <p className="mt-0.5 flex items-baseline gap-2 font-sans text-[0.8125rem] tabular-nums">
            <span className="text-samara-ivory">{priceLabel}</span>
            {mrpLabel && (
              <s className="text-[0.75rem] text-samara-mute">
                <span className="sr-only">MRP </span>
                {mrpLabel}
              </s>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={adding}
          tabIndex={shown ? 0 : -1}
          className={cn(goldBtn, 'min-h-[3rem] shrink-0 px-6')}
        >
          {adding && <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" strokeWidth={1.5} />}
          {adding ? 'Adding...' : 'Add to Bag'}
        </button>
      </div>
    </div>
  );
}
