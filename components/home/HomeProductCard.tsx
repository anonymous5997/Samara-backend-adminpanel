'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { ArrowLeft, ArrowRight, Loader2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useShell } from '@/components/shell/ShellProvider';
import { resolveFinalPrice, type ResolvedPrice } from '@/lib/resolve-product-price';
import { formatPriceSync } from '@/lib/currency-utils';
import { getUserRegion } from '@/lib/region/client';
import { getCurrencyRates } from '@/lib/currency/get-currency-rates';
import { cn } from '@/lib/utils';
import type { ProductWithImages } from './types';

export type CardTone = 'light' | 'dark';

/* ------------------------------------------------------------------ */
/* Images — only the product's own photos                              */
/* ------------------------------------------------------------------ */

const OPTIMIZED_HOSTS = new Set(['wrsrobuicquzpfgnfnmh.supabase.co', 'images.pexels.com']);

function usable(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.trim() !== '' && !url.includes('placeholder.com');
}

function isOptimizable(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && OPTIMIZED_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

/** Primary photo plus an optional second photo for the hover crossfade. */
export function productImages(product: ProductWithImages): { primary: string | null; secondary: string | null } {
  const all = (product.images ?? []).map((img) => img.image_url).filter(usable);
  const primary = usable(product.primary_image_url) ? product.primary_image_url : all[0] ?? null;
  const secondary = all.find((url) => url !== primary) ?? null;
  return { primary, secondary };
}

/* ------------------------------------------------------------------ */
/* Pricing — the storefront pattern from components/ProductSection.tsx */
/* ------------------------------------------------------------------ */

export function useHomePrices(products: ProductWithImages[]): Record<string, ResolvedPrice> {
  const { currency } = useCart();
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [priceMap, setPriceMap] = useState<Record<string, ResolvedPrice>>({});

  useEffect(() => {
    let alive = true;
    getCurrencyRates()
      .then((r) => alive && setRates(r))
      .catch((err) => console.error('Failed to load currency rates:', err));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!rates || !products.length) return;
    let alive = true;
    const region = getUserRegion();

    (async () => {
      const map: Record<string, ResolvedPrice> = {};
      for (const product of products) {
        try {
          map[String(product.id)] = await resolveFinalPrice(product, region, currency, rates);
        } catch (err) {
          console.error(`Price resolution failed for product ${product.id}:`, err);
        }
      }
      if (alive) setPriceMap(map);
    })();

    return () => {
      alive = false;
    };
  }, [products, currency, rates]);

  return priceMap;
}

function Price({ price, tone }: { price: ResolvedPrice | undefined; tone: CardTone }) {
  const muted = tone === 'dark' ? 'text-samara-mute' : 'text-samara-cream-mute';
  if (!price) {
    return <span aria-hidden className={cn('block h-4 w-16', tone === 'dark' ? 'bg-samara-forest-2' : 'bg-samara-cream-2')} />;
  }
  if (!price.displayPrice) return null;
  const showMrp = typeof price.mrp === 'number' && price.mrp > price.displayPrice;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 font-sans text-[0.8125rem] tabular-nums">
      <span className={tone === 'dark' ? 'text-samara-ivory' : 'text-samara-cream-ink'}>
        {formatPriceSync(price.displayPrice, price.currency)}
      </span>
      {showMrp && (
        <s className={cn('text-[0.75rem]', muted)}>
          <span className="sr-only">MRP </span>
          {formatPriceSync(price.mrp, price.currency)}
        </s>
      )}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Card                                                                 */
/* ------------------------------------------------------------------ */

interface HomeProductCardProps {
  product: ProductWithImages;
  index: number;
  price: ResolvedPrice | undefined;
  tone?: CardTone;
}

export function HomeProductCard({ product, index, price, tone = 'light' }: HomeProductCardProps) {
  const { addToCart } = useCart();
  const { openCart } = useShell();
  const [pending, setPending] = useState(false);
  const { primary, secondary } = productImages(product);
  const href = `/products/${product.slug}`;
  const dark = tone === 'dark';
  const sizes = '(min-width: 1280px) 18vw, (min-width: 1024px) 24vw, (min-width: 640px) 38vw, 74vw';

  const onAdd = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      await addToCart(String(product.id), undefined, 1);
      openCart();
    } catch (err) {
      console.error('Add to bag failed:', err);
    } finally {
      setPending(false);
    }
  };

  return (
    <article className="group relative">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden
        className={cn('sm-zoom relative block aspect-[4/5] w-full', dark ? 'bg-samara-forest-2' : 'bg-samara-cream-2')}
      >
        {primary ? (
          <>
            <Image
              src={primary}
              alt={product.name}
              fill
              sizes={sizes}
              unoptimized={!isOptimizable(primary)}
              className="object-cover"
            />
            {secondary && (
              <Image
                src={secondary}
                alt=""
                fill
                sizes={sizes}
                unoptimized={!isOptimizable(secondary)}
                className="hidden object-cover opacity-0 transition-opacity duration-900 ease-editorial lg:block [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <span
            className={cn(
              'absolute inset-0 flex items-center justify-center font-serif text-6xl font-light',
              dark ? 'text-samara-mute' : 'text-samara-cream-mute',
            )}
          >
            {product.name.trim().charAt(0).toUpperCase()}
          </span>
        )}
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn('font-sans text-[0.6875rem] tabular-nums tracking-[0.18em]', dark ? 'text-samara-mute' : 'text-samara-cream-mute')}>
            {String(index + 1).padStart(2, '0')}
          </p>
          <h3 className="mt-1.5 font-serif text-[1.1875rem] font-normal leading-snug">
            <Link
              href={href}
              className={cn(
                'line-clamp-2 transition-colors duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2',
                dark
                  ? 'text-samara-ivory hover:text-samara-gold focus-visible:outline-samara-gold'
                  : 'text-samara-cream-ink hover:text-samara-gold-deep focus-visible:outline-samara-cream-ink',
              )}
            >
              {product.name}
            </Link>
          </h3>
          <div className="mt-2">
            <Price price={price} tone={tone} />
          </div>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={pending}
          aria-busy={pending}
          aria-label={`Add ${product.name} to bag`}
          className={cn(
            'mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 disabled:cursor-wait',
            dark
              ? 'border-samara-ivory/45 text-samara-ivory hover:border-samara-gold hover:bg-samara-gold hover:text-samara-cream-ink focus-visible:outline-samara-gold'
              : 'border-samara-gold-deep/60 text-samara-gold-deep hover:border-samara-cream-ink hover:bg-samara-cream-ink hover:text-samara-cream focus-visible:outline-samara-cream-ink',
          )}
        >
          {pending ? (
            <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" strokeWidth={1.5} />
          ) : (
            <ShoppingBag aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Rail — scroll-snap row + "01 — 0N" counter with arrow buttons        */
/* ------------------------------------------------------------------ */

export function useRail(count: number) {
  const ref = useRef<HTMLUListElement | null>(null);
  const [state, setState] = useState({ current: 1, canPrev: false, canNext: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const scrollable = max > 2;
    const progress = scrollable ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 0;
    setState({
      current: Math.round(progress * (count - 1)) + 1,
      canPrev: scrollable && el.scrollLeft > 2,
      canNext: scrollable && el.scrollLeft < max - 2,
    });
  }, [count]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      ro?.disconnect();
    };
  }, [measure]);

  const step = useCallback((dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const width = first ? first.getBoundingClientRect().width + gap : el.clientWidth * 0.8;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * width, behavior: reduce ? 'auto' : 'smooth' });
  }, []);

  return { ref, ...state, step };
}

export function RailControls({
  count,
  current,
  canPrev,
  canNext,
  step,
  tone = 'light',
  label,
  className,
}: {
  count: number;
  current: number;
  canPrev: boolean;
  canNext: boolean;
  step: (dir: 1 | -1) => void;
  tone?: CardTone;
  label: string;
  className?: string;
}) {
  const dark = tone === 'dark';
  const pad = (n: number) => String(n).padStart(2, '0');
  const btn = cn(
    'flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 disabled:opacity-30 disabled:pointer-events-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2',
    dark
      ? 'border-samara-gold/60 text-samara-gold hover:bg-samara-gold hover:text-samara-cream-ink focus-visible:outline-samara-gold'
      : 'border-samara-cream-ink/50 text-samara-cream-ink hover:bg-samara-cream-ink hover:text-samara-cream focus-visible:outline-samara-cream-ink',
  );
  const scrollable = canPrev || canNext;

  return (
    <div className={cn('flex items-center gap-5', className)}>
      <p
        className={cn('flex items-center gap-3 font-sans text-[0.6875rem] tabular-nums tracking-[0.18em]', dark ? 'text-samara-mute' : 'text-samara-cream-mute')}
      >
        <span className={dark ? 'text-samara-ivory' : 'text-samara-cream-ink'}>{pad(current)}</span>
        <span aria-hidden className={cn('h-px w-10', dark ? 'bg-samara-mute/50' : 'bg-samara-cream-ink/30')} />
        <span>{pad(count)}</span>
        <span className="sr-only"> of {label}</span>
      </p>
      {scrollable && (
        <div className="flex items-center gap-2.5">
          <button type="button" className={btn} onClick={() => step(-1)} disabled={!canPrev} aria-label={`Previous ${label}`}>
            <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.25} />
          </button>
          <button type="button" className={btn} onClick={() => step(1)} disabled={!canNext} aria-label={`Next ${label}`}>
            <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.25} />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Card widths: ~1.3 visible at 390, ~2.4 at 768, 4 at desktop.
 * Fixed widths (never stretched) so one or two products sit as a tidy group.
 */
export const RAIL_ITEM =
  'w-[74%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2.4)] lg:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4.5rem)/4)]';
export const RAIL_LIST =
  '-mx-[var(--sm-gutter)] flex scroll-px-[var(--sm-gutter)] px-[var(--sm-gutter)] lg:mx-0 lg:scroll-px-0 lg:px-0 snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden motion-reduce:scroll-auto';
