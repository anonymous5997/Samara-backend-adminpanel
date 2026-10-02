'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';
import type { HomeCollection } from './types';

const ARCH = 'rounded-t-[999px]';
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Collections — forest band with a scroll-snap row of arch-framed cards.
 * Every card links to the real /collections/<slug> route. Collections have
 * no imagery today (hero_image_url is null), so the arch renders a
 * typographic ornament instead of a photo.
 */
export function CollectionsArches({ collections }: { collections: HomeCollection[] }) {
  const rowRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [overflowing, setOverflowing] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const max = row.scrollWidth - row.clientWidth;
    const first = row.firstElementChild as HTMLElement | null;
    const second = first?.nextElementSibling as HTMLElement | null;
    const step = first && second ? second.offsetLeft - first.offsetLeft : row.clientWidth;
    const left = row.scrollLeft;

    setOverflowing(max > 1);
    setEdges({ start: left <= 1, end: left >= max - 1 });
    setProgress(max > 1 ? Math.min(1, left / max) : 1);
    // At the far end the last card is in view: report it as current.
    const idx = left >= max - 1 && max > 1 ? collections.length - 1 : Math.round(left / step);
    setActive(Math.max(0, Math.min(collections.length - 1, idx)));
  }, [collections.length]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    measure();
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    row.addEventListener('scroll', onScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(row);
    return () => {
      cancelAnimationFrame(frame);
      row.removeEventListener('scroll', onScroll);
      ro?.disconnect();
    };
  }, [measure]);

  const scrollByCard = (dir: 1 | -1) => {
    const row = rowRef.current;
    const first = row?.firstElementChild as HTMLElement | null;
    if (!row || !first) return;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    row.scrollBy({
      left: dir * (first.offsetWidth + gap),
      behavior: reduce ? 'auto' : 'smooth',
    });
  };

  if (collections.length === 0) return null;

  return (
    <section
      aria-labelledby="home-collections-title"
      className="relative overflow-hidden bg-samara-forest py-[clamp(4rem,8vw,7.5rem)]"
    >
      <div className="sm-container">
        <div className="mb-10 flex flex-col gap-8 md:mb-14 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <p className="sm-eyebrow mb-5 flex items-center gap-4 text-samara-gold">
              <span>Collections</span>
              <span aria-hidden className="h-px w-10 bg-samara-gold/50" />
            </p>
            <h2
              id="home-collections-title"
              className="font-serif text-[clamp(2.25rem,4.4vw,3.75rem)] font-light uppercase leading-[1.02] tracking-[0.04em] text-samara-ivory"
            >
              The
              <br />
              Collections
            </h2>
            <p className="mt-5 font-serif text-lg italic text-samara-mute md:text-xl">
              Curated edits from the Samara house.
            </p>
          </Reveal>

          {overflowing && (
            <div className="flex items-center gap-6 md:pb-2">
              <p className="flex items-center gap-4 font-sans text-[0.6875rem] font-medium tracking-[0.2em] text-samara-mute">
                <span className="text-samara-ivory">{pad(active + 1)}</span>
                <span aria-hidden className="relative h-px w-14 bg-samara-line">
                  <span
                    className="absolute inset-y-0 left-0 bg-samara-gold transition-[width] duration-300 ease-editorial"
                    style={{ width: `${Math.max(12, progress * 100)}%` }}
                  />
                </span>
                <span>{pad(collections.length)}</span>
                <span className="sr-only">collections</span>
              </p>
              <div className="flex items-center gap-3">
                <ArrowButton
                  label="Previous collections"
                  disabled={edges.start}
                  onClick={() => scrollByCard(-1)}
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.25} />
                </ArrowButton>
                <ArrowButton label="Next collections" disabled={edges.end} onClick={() => scrollByCard(1)}>
                  <ArrowRight className="h-4 w-4" strokeWidth={1.25} />
                </ArrowButton>
              </div>
            </div>
          )}
        </div>

        <ul
          ref={rowRef}
          className="-mx-[var(--sm-gutter)] flex snap-x snap-mandatory scroll-px-[var(--sm-gutter)] gap-4 overflow-x-auto px-[var(--sm-gutter)] pb-2 [scrollbar-width:none] md:gap-5 lg:gap-6 [&::-webkit-scrollbar]:hidden"
          aria-label="Collections"
        >
          {collections.map((c, i) => (
            <li
              key={c.id}
              className="shrink-0 grow-0 basis-[calc((100%_-_16px)/1.25)] snap-start md:basis-[calc((100%_-_40px)/2.2)] lg:basis-[calc((100%_-_48px)/3)]"
            >
              <Reveal delay={Math.min(i, 3) * 120} className="h-full">
                <ArchCard collection={c} index={i} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-samara-gold/60 text-samara-gold transition-colors duration-300 ease-editorial hover:border-samara-gold hover:bg-samara-gold hover:text-samara-forest focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function ArchCard({ collection: c, index }: { collection: HomeCollection; index: number }) {
  const line = c.subtitle || c.description;
  const numeral = pad(index + 1);

  return (
    <Link
      href={c.href}
      className={cn('group relative block aspect-[3/4.6] p-2 focus-visible:outline-none md:p-2.5', ARCH)}
    >
      {/* Thin gold outline arch around the whole card */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 border border-samara-gold/50 transition-colors duration-700 ease-editorial group-hover:border-samara-gold group-focus-visible:border-samara-gold',
          ARCH,
        )}
      />

      <span className={cn('sm-zoom relative block h-full w-full overflow-hidden', ARCH)}>
        {c.imageUrl ? (
          <Image
            src={c.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 31vw, (min-width: 768px) 43vw, 78vw"
            className="object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,#22362A_0%,#1E3024_48%,#1B2A1F_100%)]"
          >
            {/* soft lift behind the ornament (forest only) */}
            <span className="absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(ellipse_at_50%_28%,rgba(243,235,219,0.07),transparent_65%)]" />
            {/* fine inner gold arch */}
            <span className={cn('absolute inset-3 border border-samara-gold/20 md:inset-4', ARCH)} />
            <span
              className={cn('absolute inset-[22px] border border-samara-gold/[0.08] md:inset-[26px]', ARCH)}
            />
            {/* typographic ornament, centred in the upper arch */}
            <span className="absolute inset-x-0 bottom-[40%] top-[10%] flex flex-col items-center justify-center">
              <span className="font-serif text-[clamp(6rem,9vw,9.5rem)] font-light italic leading-none text-samara-gold/[0.17] transition-colors duration-1000 ease-editorial group-hover:text-samara-gold/30">
                {numeral}
              </span>
              <span className="mt-4 h-8 w-px bg-samara-gold/30 md:h-10" />
            </span>
          </span>
        )}

        {/* bottom gradient behind the text */}
        <span
          aria-hidden
          className={cn(
            'absolute inset-x-0 bottom-0 h-1/2',
            c.imageUrl
              ? 'bg-gradient-to-t from-samara-black/[0.85] via-samara-black/40 to-transparent'
              : 'bg-gradient-to-t from-samara-black/40 to-transparent',
          )}
        />

        <span className="absolute inset-x-0 bottom-0 flex flex-col items-start p-5 md:p-6">
          <span className="font-serif text-[clamp(1.375rem,1.9vw,1.75rem)] font-normal uppercase leading-tight tracking-[0.06em] text-samara-ivory">
            {c.name}
          </span>
          {line && (
            <span className="mt-1.5 block w-full truncate font-sans text-[0.8125rem] text-samara-mute">
              {line}
            </span>
          )}
          <span className="mt-5 flex h-10 w-10 items-center justify-center rounded-full border border-samara-ivory/40 bg-samara-black/20 text-samara-ivory transition-colors duration-300 ease-editorial group-hover:border-samara-gold group-hover:bg-samara-gold group-hover:text-samara-forest">
            <ArrowRight className="h-4 w-4" strokeWidth={1.25} />
          </span>
        </span>
      </span>
    </Link>
  );
}
