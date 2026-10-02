'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Sticky info column (lg+). When the column is taller than the viewport,
 * its sticky `top` goes negative so it scrolls through naturally and then
 * pins with its bottom edge in view — nothing is ever hidden.
 */
export function StickyColumn({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [top, setTop] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sm-header-h')) || 72;
      const preferred = header + 40;
      const fit = window.innerHeight - el.offsetHeight - 40;
      setTop(Math.min(preferred, fit));
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn('lg:sticky', className)}
      style={top === null ? undefined : ({ top: `${top}px` } as CSSProperties)}
    >
      {children}
    </div>
  );
}
