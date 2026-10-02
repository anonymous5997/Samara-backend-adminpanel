import { cn } from '@/lib/utils';

/**
 * Decorative layers for the listing heroes. Hairline gold only — no glow,
 * no gradients. All aria-hidden.
 */

/** Nested arch outlines bleeding off the right edge (desktop-weighted). */
export function ArchOrnament({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute -bottom-px right-[-18vw] top-[18%] w-[62vw] max-w-[640px] sm:right-[-6vw] sm:w-[44vw] lg:right-[4vw] lg:w-[30vw]',
        className,
      )}
    >
      <span className="absolute inset-0 rounded-t-[999px] border border-b-0 border-samara-gold/[0.16]" />
      <span className="absolute inset-[18px] bottom-0 rounded-t-[999px] border border-b-0 border-samara-gold/10" />
      <span className="absolute inset-[44px] bottom-0 rounded-t-[999px] border border-b-0 border-samara-gold/[0.06]" />
    </div>
  );
}

/** Small gold rule with a lozenge — sits above festive headings. */
export function LozengeRule({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('flex items-center gap-3 text-samara-gold', className)}>
      <span className="h-px w-10 bg-samara-gold/50 md:w-16" />
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
        <path d="M7 0.75L13.25 7L7 13.25L0.75 7Z" stroke="currentColor" strokeWidth="1" />
        <path d="M7 4.25L9.75 7L7 9.75L4.25 7Z" fill="currentColor" fillOpacity="0.6" />
      </svg>
      <span className="h-px w-10 bg-samara-gold/50 md:w-16" />
    </span>
  );
}

/**
 * Festive ornament: a fine gold mandala of concentric rings and petals,
 * drawn in hairlines and parked half off the hero's right edge.
 */
export function FestiveOrnament({ className }: { className?: string }) {
  const petals = Array.from({ length: 16 }, (_, i) => i * 22.5);
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute right-[-42vw] top-1/2 w-[92vw] max-w-[760px] -translate-y-1/2 text-samara-gold sm:right-[-26vw] sm:w-[64vw] lg:right-[-8vw] lg:w-[46vw]',
        className,
      )}
    >
      <svg viewBox="0 0 400 400" fill="none" className="h-auto w-full" stroke="currentColor" strokeWidth="0.6">
        <g opacity="0.32">
          <circle cx="200" cy="200" r="196" />
          <circle cx="200" cy="200" r="186" strokeDasharray="1 5" />
          <circle cx="200" cy="200" r="150" />
          <circle cx="200" cy="200" r="64" />
          <circle cx="200" cy="200" r="24" />
        </g>
        <g opacity="0.24">
          {petals.map((deg) => (
            <path
              key={deg}
              d="M200 50 C 222 92, 222 126, 200 136 C 178 126, 178 92, 200 50 Z"
              transform={`rotate(${deg} 200 200)`}
            />
          ))}
        </g>
        <g opacity="0.18">
          {petals.map((deg) => (
            <path
              key={`i-${deg}`}
              d="M200 136 L 212 172 L 200 176 L 188 172 Z"
              transform={`rotate(${deg + 11.25} 200 200)`}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
