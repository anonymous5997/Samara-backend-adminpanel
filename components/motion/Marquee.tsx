import { Fragment } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps {
  items: string[];
  /** Seconds for one full loop. Larger is slower. */
  duration?: number;
  /** Times the items repeat per half, so short lists still fill wide screens. */
  repeat?: number;
  className?: string;
}

/**
 * Continuously moving typographic band. Content is rendered twice so the
 * CSS animation (translate -50%) loops without a seam. The duplicate is
 * hidden from assistive tech. Stops under prefers-reduced-motion.
 */
export function Marquee({
  items,
  duration = 40,
  repeat = 2,
  className,
}: MarqueeProps) {
  if (items.length === 0) return null;
  const sequence = Array.from({ length: repeat }, () => items).flat();

  const row = (hidden: boolean) => (
    <ul
      className="flex shrink-0 items-center"
      aria-hidden={hidden || undefined}
    >
      {sequence.map((item, i) => (
        <Fragment key={`${item}-${i}`}>
          <li className="whitespace-nowrap px-6 md:px-10">{item}</li>
          <li aria-hidden className="text-samara-gold">
            •
          </li>
        </Fragment>
      ))}
    </ul>
  );

  return (
    <div
      className={cn('sm-marquee overflow-hidden', className)}
      style={{ ['--marquee-duration' as string]: `${duration}s` }}
    >
      <div className="sm-marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
