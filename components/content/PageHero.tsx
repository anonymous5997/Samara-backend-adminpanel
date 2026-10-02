import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';

interface PageHeroProps {
  eyebrow: string;
  /** Upright part of the title. */
  title?: ReactNode;
  /** Italic gold accent part of the title. */
  accent?: ReactNode;
  intro?: ReactNode;
  className?: string;
}

/**
 * Editorial hero band shared by the brand and legal pages:
 * eyebrow + large serif title with an italic accent + one muted line.
 */
export function PageHero({ eyebrow, title, accent, intro, className }: PageHeroProps) {
  return (
    <section
      className={cn('relative overflow-hidden border-b border-samara-line bg-samara-black', className)}
    >
      <div className="sm-container pb-16 pt-16 sm:pb-20 sm:pt-24 lg:pb-28 lg:pt-32">
        <Reveal>
          <p className="sm-eyebrow flex items-center gap-4 text-samara-gold">
            {eyebrow}
            <span aria-hidden className="block h-px w-12 bg-samara-gold/50" />
          </p>
          <h1 className="sm-display-l mt-6 max-w-5xl font-light">
            {title}
            {title && accent ? ' ' : null}
            {accent ? <span className="sm-accent">{accent}</span> : null}
          </h1>
          {intro ? (
            <p className="mt-6 max-w-xl font-serif text-xl font-light italic leading-snug text-samara-mute sm:text-2xl">
              {intro}
            </p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
