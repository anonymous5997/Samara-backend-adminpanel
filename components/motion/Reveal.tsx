'use client';

import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

type RevealVariant = 'up' | 'fade' | 'mask' | 'scale';

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  variant?: RevealVariant;
  /** Delay in ms — use for staggering siblings. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Scroll-reveal wrapper. Styling lives in globals.css ([data-reveal]);
 * this only flips [data-revealed] when the element enters the viewport.
 * Reduced motion and no-JS both render content immediately.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  variant = 'up',
  delay = 0,
  className,
  style,
}: RevealProps) {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      data-revealed={inView ? '' : undefined}
      className={cn(className)}
      style={{ ...style, '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
