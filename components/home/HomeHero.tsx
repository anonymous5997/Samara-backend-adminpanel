'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type TouchEvent,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { HOME_COPY } from '@/config/homepage';
import { cn } from '@/lib/utils';
import type { HomeHeroSlide } from './types';

/**
 * Homepage hero — full-bleed slides from Admin → Hero Slides.
 * Media, headline, subtitle and CTAs all come from the slide rows; the
 * eyebrow, aside and keywords are brand copy from config/homepage.ts.
 * No slides / no media: a forest-green, type-only hero with the same layout.
 */

const INTERVAL_MS = 7000;
const SWIPE_PX = 48;

/** First-load timeline (ms); later slide changes use the quicker set. */
const FIRST = { eyebrow: 250, lead: 350, accent: 550, subtitle: 750, ctas: 900 };
const NEXT = { eyebrow: 0, lead: 80, accent: 200, subtitle: 320, ctas: 420 };
const STATIC_DELAY = 1100;

const delay = (ms: number) => ({ ['--anim-delay' as string]: `${ms}ms` }) as CSSProperties;
const pad = (n: number) => String(n).padStart(2, '0');

/** Shown only when there are no active slides at all. */
const FALLBACK_SLIDE: HomeHeroSlide = {
  id: 'fallback',
  title: HOME_COPY.marquee[2], // 'Where heritage meets modern elegance'
  subtitle: null,
  mediaUrl: null,
  mediaType: 'image',
  primary: { label: 'Explore Sarees', href: '/sarees' },
  secondary: null,
};

function splitTitle(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return { lead: title.trim(), accent: '' };
  return { lead: words.slice(0, -1).join(' '), accent: words[words.length - 1] };
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

/** Type-only backdrop: deep forest with a thin arch, echoing the arched frames. */
function FallbackBackdrop() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 bg-samara-forest bg-[radial-gradient(ellipse_at_72%_38%,theme(colors.samara.forest-2)_0%,theme(colors.samara.forest)_38%,theme(colors.samara.black)_100%)]"
    >
      <div className="absolute right-[-18%] top-[12%] aspect-[3/4] h-[52%] rounded-t-full border border-samara-gold/20 sm:right-[6%] lg:right-[16%] lg:top-[16%] lg:h-[66%]" />
      <div className="absolute right-[-14%] top-[15%] aspect-[3/4] h-[46%] rounded-t-full border border-samara-ivory/[0.07] sm:right-[8.5%] lg:right-[18.5%] lg:top-[20%] lg:h-[58%]" />
    </div>
  );
}

function SlideMedia({ slide, first }: { slide: HomeHeroSlide; first: boolean }) {
  if (!slide.mediaUrl) return <FallbackBackdrop />;
  const fit = 'object-cover object-[65%_30%] lg:object-center';
  if (slide.mediaType === 'video') {
    return (
      <video
        className={cn('absolute inset-0 h-full w-full', fit)}
        src={slide.mediaUrl}
        autoPlay
        muted
        loop
        playsInline
        preload={first ? 'auto' : 'metadata'}
        aria-hidden
      />
    );
  }
  return (
    <Image
      src={slide.mediaUrl}
      alt=""
      fill
      sizes="100vw"
      priority={first}
      className={fit}
    />
  );
}

function Cta({
  cta,
  variant,
  className,
  style,
}: {
  cta: { label: string; href: string };
  variant: 'primary' | 'secondary';
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Link
      href={cta.href}
      style={style}
      className={cn(
        'sm-btn group w-full sm:w-auto',
        variant === 'primary'
          ? 'bg-samara-gold text-samara-cream-ink hover:bg-samara-ivory'
          : 'sm-btn-ghost',
        className,
      )}
    >
      {cta.label}
      <ArrowRight
        aria-hidden
        className="h-4 w-4 transition-transform duration-300 ease-editorial group-hover:translate-x-1"
        strokeWidth={1.25}
      />
    </Link>
  );
}

export function HomeHero({ slides }: { slides: HomeHeroSlide[] }) {
  const items = slides.length > 0 ? slides : [FALLBACK_SLIDE];
  const count = items.length;
  const multi = count > 1;

  const [index, setIndex] = useState(0);
  const [cycled, setCycled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (to: number) => {
      setCycled(true);
      setIndex(((to % count) + count) % count);
    },
    [count],
  );
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  const autoplay = multi && !reduced && !hovered && !focused && !hidden;

  useEffect(() => {
    if (!autoplay) return;
    const t = window.setTimeout(next, INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [autoplay, next]);

  useEffect(() => {
    const update = () => setHidden(document.visibilityState === 'hidden');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  // Looping video is motion too: hold it still when reduced motion is asked for.
  useEffect(() => {
    sectionRef.current?.querySelectorAll('video').forEach((v) => {
      if (reduced) v.pause();
      else void v.play().catch(() => {});
    });
  }, [reduced]);

  const onBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!multi) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    }
  };
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start || !multi) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next();
    else prev();
  };

  const slide = items[index];
  const { lead, accent } = splitTitle(slide.title);
  const d = cycled ? NEXT : FIRST;
  const rise = 'sm-anim-rise';
  const fade = 'sm-anim-fade-up';

  return (
    <section
      ref={sectionRef}
      aria-roledescription={multi ? 'carousel' : undefined}
      aria-label={multi ? 'Featured' : undefined}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={onBlur}
      onTouchStart={multi ? onTouchStart : undefined}
      onTouchEnd={multi ? onTouchEnd : undefined}
      className="relative isolate h-[92svh] min-h-[600px] w-full overflow-hidden bg-samara-forest text-samara-ivory lg:h-[100svh] lg:min-h-[640px]"
    >
      {/* ---- Media layers (crossfade) ---- */}
      <div className="sm-anim-hero-image absolute inset-0 -z-10">
        {items.map((s, i) => {
          const active = i === index;
          return (
            <div
              key={s.id}
              aria-hidden
              className={cn(
                'absolute inset-0 transition-opacity duration-1200 ease-editorial motion-reduce:transition-none',
                active ? 'opacity-100' : 'opacity-0',
              )}
            >
              <div
                className={cn(
                  'absolute inset-0 motion-reduce:scale-100 motion-reduce:transition-none',
                  active
                    ? 'scale-100 transition-transform duration-[7000ms] ease-out'
                    : 'scale-[1.06] transition-transform duration-0 delay-[1200ms]',
                )}
              >
                <SlideMedia slide={s} first={i === 0} />
              </div>
            </div>
          );
        })}

        {/* Legibility: forest wash from the left + a floor; mobile reads bottom-up */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-samara-black/95 via-samara-black/[0.55] via-45% to-samara-black/10 lg:bg-gradient-to-r lg:from-samara-black/[0.85] lg:via-samara-black/[0.45] lg:via-35% lg:to-transparent lg:to-60%"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 hidden h-2/5 bg-gradient-to-t from-samara-black/70 to-transparent lg:block"
        />
      </div>

      {/* ---- Text ---- */}
      <div
        className={cn(
          'sm-container relative flex h-full flex-col justify-end pt-[84px] sm:pb-32 lg:justify-center lg:pb-16 lg:pt-[72px]',
          multi ? 'pb-[9.5rem]' : 'pb-24',
        )}
      >
        <div aria-live={autoplay ? 'off' : 'polite'} aria-atomic="true">
          <div
            key={slide.id}
            role={multi ? 'group' : undefined}
            aria-roledescription={multi ? 'slide' : undefined}
            aria-label={multi ? `${index + 1} of ${count}` : undefined}
            className="max-w-[40rem] lg:max-w-[46rem]"
          >
            <p
              className={cn(fade, 'flex items-center gap-5 text-samara-gold')}
              style={delay(d.eyebrow)}
            >
              <span className="sm-eyebrow text-current">{HOME_COPY.heroEyebrow}</span>
              <span aria-hidden className="h-px w-12 bg-samara-gold/60" />
            </p>

            {slide.title && (
              <h2 className="mt-5 font-serif text-[length:clamp(3.2rem,5.6vw_+_0.9rem,7rem)] font-light leading-[0.98] tracking-[-0.015em] text-samara-ivory lg:mt-7">
                <span className="sm-line-mask">
                  <span className={rise} style={delay(d.lead)}>
                    {lead}
                  </span>
                </span>
                {accent && ' '}
                {accent && (
                  <span className="sm-line-mask -mt-[0.06em]">
                    <span className={cn(rise, 'sm-accent pr-[0.08em]')} style={delay(d.accent)}>
                      {accent}
                    </span>
                  </span>
                )}
              </h2>
            )}

            {slide.subtitle && (
              <p
                className={cn(
                  fade,
                  'mt-5 max-w-[32ch] font-serif text-[1.25rem] font-light italic leading-snug text-samara-ivory/[0.85] lg:mt-7 lg:text-[1.6rem]',
                )}
                style={delay(d.subtitle)}
              >
                {slide.subtitle}
              </p>
            )}

            {(slide.primary || slide.secondary) && (
              <div
                className={cn(fade, 'mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 lg:mt-10')}
                style={delay(d.ctas)}
              >
                {slide.primary && <Cta cta={slide.primary} variant="primary" />}
                {slide.secondary && <Cta cta={slide.secondary} variant="secondary" />}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Desktop aside ---- */}
      <div
        aria-hidden
        className={cn(fade, 'absolute right-[var(--sm-gutter)] top-[24%] hidden flex-col items-center gap-5 lg:flex')}
        style={delay(STATIC_DELAY)}
      >
        <p className="text-center font-sans text-[10px] font-medium uppercase leading-[2.2] tracking-[0.32em] text-samara-ivory/80">
          {HOME_COPY.heroAside.split(/\s+/).map((w) => (
            <span key={w} className="block">
              {w}
            </span>
          ))}
        </p>
        <span className="h-14 w-px bg-samara-ivory/[0.45]" />
      </div>

      {/* ---- Bottom bar: keywords · scroll cue · controls ---- */}
      <div className="sm-container absolute inset-x-0 bottom-0 flex flex-col-reverse gap-3 pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pb-7 lg:pb-10">
        <p
          className={cn(
            fade,
            'flex min-h-[44px] flex-wrap items-center gap-x-2.5 gap-y-1 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-samara-ivory/70 sm:gap-x-3.5 sm:tracking-[0.28em]',
          )}
          style={delay(STATIC_DELAY)}
        >
          {HOME_COPY.heroKeywords.map((k, i) => (
            <span key={k} className="flex items-center gap-2.5 sm:gap-3.5">
              {i > 0 && <span aria-hidden className="h-3 w-px bg-samara-ivory/40" />}
              {k}
            </span>
          ))}
        </p>

        {multi && (
          <div
            className={cn(fade, 'flex shrink-0 items-center justify-between gap-4 sm:justify-end sm:gap-6')}
            style={delay(STATIC_DELAY)}
            onKeyDown={onKeyDown}
          >
            <p className="flex items-center gap-3 font-sans text-[11px] font-medium tabular-nums tracking-[0.2em]">
              <span className="text-samara-ivory">{pad(index + 1)}</span>
              <span aria-hidden className="h-px w-10 bg-samara-ivory/40" />
              <span className="text-samara-ivory/[0.55]">{pad(count)}</span>
              <span className="sr-only">
                Slide {index + 1} of {count}
              </span>
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous slide"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-samara-ivory/40 text-samara-ivory transition-colors duration-300 ease-editorial hover:border-samara-gold hover:text-samara-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={1.25} aria-hidden />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next slide"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-samara-ivory/40 text-samara-ivory transition-colors duration-300 ease-editorial hover:border-samara-gold hover:text-samara-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold"
              >
                <ArrowRight className="h-4 w-4" strokeWidth={1.25} aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>

      <div aria-hidden className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 lg:block">
        <div className={cn(fade, 'flex flex-col items-center gap-3')} style={delay(STATIC_DELAY + 200)}>
          <span className="h-10 w-px bg-gradient-to-b from-transparent to-samara-ivory/60" />
          <span className="font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-samara-ivory/60">
            Scroll
          </span>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
