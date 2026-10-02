import Link from 'next/link';
import type { ReactNode } from 'react';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';

interface Crumb {
  label: string;
  href?: string;
}

interface ListingHeroProps {
  eyebrow: string;
  /** Serif title; wrap the accent word in <span className="sm-accent">. */
  title: ReactNode;
  intro?: ReactNode;
  crumbs?: Crumb[];
  /** Right-aligned meta on desktop (e.g. a piece count). */
  meta?: ReactNode;
  /** Decorative layer rendered behind the copy (ornament, arch …). */
  ornament?: ReactNode;
  /** Small decorative mark above the eyebrow. */
  kicker?: ReactNode;
  tone?: 'forest' | 'black';
  className?: string;
}

/**
 * Editorial page header shared by the listing pages: breadcrumb, eyebrow
 * with a gold rule, a large light serif title with an italic accent and a
 * one-line muted intro. Left-aligned, closed by a hairline.
 */
export function ListingHero({
  eyebrow,
  title,
  intro,
  crumbs,
  meta,
  ornament,
  kicker,
  tone = 'forest',
  className,
}: ListingHeroProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-samara-line',
        tone === 'forest' ? 'bg-samara-forest' : 'bg-samara-black',
        className,
      )}
    >
      {ornament}
      <div className="sm-container relative pb-10 pt-8 md:pb-14 md:pt-12 lg:pb-16 lg:pt-14">
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-10 md:mb-16">
            <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-samara-mute">
              {crumbs.map((c, i) => (
                <li key={`${c.label}-${i}`} className="flex items-center gap-3">
                  {i > 0 && <span aria-hidden className="h-px w-4 bg-samara-mute/40" />}
                  {c.href ? (
                    <Link
                      href={c.href}
                      className="sm-link inline-flex min-h-[44px] items-center transition-colors hover:text-samara-ivory sm:min-h-0"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-samara-ivory">
                      {c.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <Reveal className="max-w-3xl">
            {kicker && <div className="mb-6">{kicker}</div>}
            <p className="sm-eyebrow mb-5 flex items-center gap-4 text-samara-gold md:mb-6">
              <span>{eyebrow}</span>
              <span aria-hidden className="h-px w-10 bg-samara-gold/50" />
            </p>
            <h1 className="font-serif text-[clamp(2.75rem,7vw,6rem)] font-light leading-[0.98] tracking-[-0.01em] text-samara-ivory">
              {title}
            </h1>
            {intro && (
              <p className="mt-5 max-w-xl font-serif text-lg italic leading-relaxed text-samara-mute md:mt-6 md:text-xl">
                {intro}
              </p>
            )}
          </Reveal>
          {meta && <div className="shrink-0 md:pb-2">{meta}</div>}
        </div>
      </div>
    </section>
  );
}

/** "03 Pieces" style counter used in the hero meta slot. */
export function PieceCount({ count, noun = 'Pieces' }: { count: number; noun?: string }) {
  return (
    <p className="flex items-center gap-4 font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-samara-mute">
      <span className="font-serif text-3xl font-light normal-case tracking-normal text-samara-ivory tabular-nums">
        {String(count).padStart(2, '0')}
      </span>
      <span aria-hidden className="h-px w-8 bg-samara-mute/40" />
      <span>{noun}</span>
    </p>
  );
}
