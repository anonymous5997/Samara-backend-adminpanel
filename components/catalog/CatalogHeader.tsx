import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';

interface CatalogHeaderProps {
  eyebrow: string;
  /** Title with the italic accent already marked up (see AccentTitle). */
  title: ReactNode;
  intro?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** Editorial page band: eyebrow, large serif title, one muted line. */
export function CatalogHeader({ eyebrow, title, intro, className, children }: CatalogHeaderProps) {
  return (
    <section className={cn('border-b border-samara-line', className)}>
      <div className="sm-container pb-10 pt-12 md:pb-14 md:pt-20 lg:pb-16 lg:pt-24">
        <Reveal className="lg:flex lg:items-end lg:justify-between lg:gap-16">
          <div className="min-w-0">
            <p className="sm-eyebrow flex items-center gap-4">
              {eyebrow}
              <span aria-hidden className="h-px w-10 bg-samara-mute/50" />
            </p>
            <h1 className="sm-display-l mt-5 !font-normal !tracking-[-0.015em] md:mt-6">{title}</h1>
          </div>
          {intro && <p className="sm-body mt-5 max-w-md lg:mt-0 lg:max-w-sm lg:pb-2">{intro}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  );
}

/** Sets the last word of a title in the gold italic accent. */
export function AccentTitle({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return <span className="sm-accent">{text}</span>;
  const last = words.pop();
  return (
    <>
      {words.join(' ')} <span className="sm-accent">{last}</span>
    </>
  );
}
