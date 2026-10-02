import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';

/**
 * Type-led brand mark: a large Cormorant "S" inside a double gold hairline
 * frame (the StoryBlock monogram, scaled for the About page). Decorative.
 */
export function Monogram({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-samara-forest-2',
        className,
      )}
    >
      <div className="absolute inset-5 border border-samara-gold/30 sm:inset-10 lg:inset-14" />
      <div className="absolute inset-7 border border-samara-gold/10 sm:inset-12 lg:inset-16" />
      <Reveal variant="fade" className="relative flex flex-col items-center">
        <span className="select-none font-serif text-[11rem] font-light italic leading-[0.8] text-samara-gold/25 sm:text-[15rem] lg:text-[22rem]">
          S
        </span>
        <span className="mt-6 flex items-center gap-4 text-[0.625rem] font-medium uppercase tracking-eyebrow text-samara-gold/70">
          <span className="block h-px w-8 bg-samara-gold/40" />
          Samara
          <span className="block h-px w-8 bg-samara-gold/40" />
        </span>
      </Reveal>
    </div>
  );
}
