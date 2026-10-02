import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** 2 columns on mobile, 3 from 1024px, 4 from 1440px. */
export const CATALOG_GRID =
  'grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:gap-y-16 lg:grid-cols-3 lg:gap-x-8 min-[1440px]:grid-cols-4 min-[1440px]:gap-x-10 min-[1440px]:gap-y-20';

export const CATALOG_CARD_SIZES = '(min-width: 1440px) 22vw, (min-width: 1024px) 30vw, 46vw';

export function CatalogGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn(CATALOG_GRID, className)}>{children}</ul>;
}

/** Flat placeholder grid (no shimmer). */
export function CatalogGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div aria-hidden className={cn(CATALOG_GRID, className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="aspect-[4/5] w-full bg-samara-char" />
          <div className="mt-4 h-2 w-16 bg-samara-forest-2" />
          <div className="mt-3 h-4 w-3/4 bg-samara-forest-2" />
          <div className="mt-3 h-3 w-20 bg-samara-forest-2" />
        </div>
      ))}
    </div>
  );
}
