'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useProductSearch } from '@/hooks/useProductSearch';
import type { SearchProduct } from '@/hooks/useProductSearch';
import { useCart } from '@/lib/cart-context';
import { resolveFinalPrice } from '@/lib/resolve-product-price';
import type { ResolvedPrice } from '@/lib/resolve-product-price';
import { formatPriceSync } from '@/lib/currency-utils';
import { getUserRegion } from '@/lib/region/client';
import { getCurrencyRates } from '@/lib/currency/get-currency-rates';
import { cn } from '@/lib/utils';

export interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_RESULTS = 8;
/** The search query is capped at 20 rows (see useProductSearch). */
const QUERY_LIMIT = 20;

const BROWSE_LINKS = [
  { href: '/sarees', label: 'Sarees' },
  { href: '/collections', label: 'Collections' },
  { href: '/festive-edit', label: 'Festive Edit' },
];

const searchHref = (q: string) => `/search?q=${encodeURIComponent(q.trim())}`;

/**
 * Prices resolved exactly as components/ProductSection.tsx does:
 * rates once, then resolveFinalPrice(product, region, currency, rates).
 */
function useResolvedPrices(products: SearchProduct[], enabled: boolean) {
  const { currency } = useCart();
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [priceMap, setPriceMap] = useState<Record<string, ResolvedPrice>>({});

  useEffect(() => {
    if (!enabled || rates) return;
    getCurrencyRates()
      .then(setRates)
      .catch((err) => console.error('Failed to load currency rates:', err));
  }, [enabled, rates]);

  useEffect(() => {
    if (!products.length || !rates) return;
    let cancelled = false;
    const region = getUserRegion();

    (async () => {
      const map: Record<string, ResolvedPrice> = {};
      for (const product of products) {
        try {
          map[product.id] = await resolveFinalPrice(product, region, currency, rates);
        } catch (err) {
          console.error('Failed to resolve price:', err);
        }
      }
      if (!cancelled) setPriceMap(map);
    })();

    return () => {
      cancelled = true;
    };
  }, [products, currency, rates]);

  return priceMap;
}

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    searchQuery,
    setSearchQuery,
    products,
    suggestions,
    pending,
    selectSuggestion,
    clearSearch,
  } = useProductSearch();

  const visible = useMemo(() => products.slice(0, MAX_RESULTS), [products]);
  const prices = useResolvedPrices(visible, open);

  // Every opening starts fresh.
  useEffect(() => {
    if (open) clearSearch();
  }, [open, clearSearch]);

  const query = searchQuery.trim();
  const hasQuery = query.length > 0;
  const shownSuggestions = suggestions.filter(
    (s) => s.toLowerCase() !== query.toLowerCase(),
  );
  const noResults = hasQuery && !pending && products.length === 0;
  const countLabel = products.length >= QUERY_LIMIT ? `${QUERY_LIMIT}+` : String(products.length);

  const close = () => onOpenChange(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!hasQuery) return;
    router.push(searchHref(query));
    close();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="sm-drawer-overlay fixed inset-0 z-[1100] bg-samara-black/95 backdrop-blur-sm" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className={cn(
            'fixed inset-0 z-[1100] flex h-[100dvh] flex-col text-samara-ivory outline-none',
            'data-[state=open]:animate-[sm-fade-up_500ms_cubic-bezier(0.22,1,0.36,1)_both]',
            'data-[state=closed]:animate-[sm-overlay-out_250ms_cubic-bezier(0.22,1,0.36,1)_both]',
            'motion-reduce:!animate-none',
          )}
        >
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>

          {/* Fixed head: never scrolls, so the close button stays reachable above a soft keyboard. */}
          <div className="sm-container w-full shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div className="flex h-16 items-center justify-between md:h-20">
              <span className="sm-eyebrow">Search</span>
              <DialogPrimitive.Close
                className="group -mr-3 flex h-11 items-center gap-3 px-3 font-sans text-[11px] uppercase tracking-eyebrow text-samara-mute transition-colors duration-300 hover:text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold"
                aria-label="Close search"
              >
                <span className="hidden md:inline">Close</span>
                <X className="h-5 w-5" strokeWidth={1.25} />
              </DialogPrimitive.Close>
            </div>

            <form role="search" onSubmit={onSubmit} className="mt-6 md:mt-12">
              <label htmlFor="sm-search-input" className="sr-only">
                Search the collection
              </label>
              <div className="relative flex items-end gap-4">
                <input
                  id="sm-search-input"
                  ref={inputRef}
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sarees, collections…"
                  className="min-w-0 flex-1 appearance-none border-0 bg-transparent pb-3 font-serif font-light leading-[1.05] text-samara-ivory caret-samara-gold outline-none placeholder:text-samara-mute/40 focus:outline-none focus:ring-0 md:pb-5 [&::-webkit-search-cancel-button]:hidden"
                  style={{ fontSize: 'clamp(2.125rem, 6vw, 5rem)', letterSpacing: '-0.01em' }}
                />
                {hasQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      clearSearch();
                      inputRef.current?.focus();
                    }}
                    className="mb-3 h-11 shrink-0 px-1 font-sans text-[11px] uppercase tracking-eyebrow text-samara-mute transition-colors duration-300 hover:text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold md:mb-5"
                  >
                    Clear
                  </button>
                )}
              </div>
              {/* Hairline underline + quiet progress line */}
              <div className="relative h-px w-full bg-samara-line">
                <div
                  aria-hidden
                  className={cn(
                    'absolute inset-y-0 left-0 w-full origin-left bg-samara-ivory/60 ease-editorial motion-reduce:transition-none',
                    hasQuery && pending
                      ? 'scale-x-100 opacity-100 transition-transform duration-1600'
                      : 'scale-x-0 opacity-0 transition-[opacity,transform] duration-300',
                  )}
                />
              </div>
              <p className="sr-only" aria-live="polite">
                {hasQuery && !pending
                  ? products.length
                    ? `${countLabel} results`
                    : 'No results'
                  : ''}
              </p>
            </form>
          </div>

          {/* Scrolling body */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="sm-container w-full pb-[max(4rem,env(safe-area-inset-bottom))] pt-10 md:pt-16">
              {!hasQuery && <BrowseLinks onNavigate={close} />}

              {hasQuery && noResults && (
                <div>
                  <p className="sm-stagger font-serif text-[clamp(1.5rem,2.4vw,2.25rem)] font-light leading-tight text-samara-ivory">
                    Nothing found for <span className="italic">“{query}”</span>
                  </p>
                  <p className="sm-body sm-stagger mt-3 max-w-md" style={{ ['--i' as string]: 1 }}>
                    Try another word or a shorter phrase, or explore the house.
                  </p>
                  <div className="mt-12 md:mt-16">
                    <BrowseLinks onNavigate={close} compact offset={2} />
                  </div>
                </div>
              )}

              {hasQuery && !noResults && (
                <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10 lg:gap-16">
                  {shownSuggestions.length > 0 && (
                    <section className="md:col-span-4 lg:col-span-3" aria-labelledby="sm-search-suggestions">
                      <p id="sm-search-suggestions" className="sm-eyebrow mb-4">
                        Suggestions
                      </p>
                      <ul className="border-t border-samara-line">
                        {shownSuggestions.map((s, i) => (
                          <li
                            key={s}
                            className="sm-stagger border-b border-samara-line"
                            style={{ ['--i' as string]: i }}
                          >
                            <button
                              type="button"
                              onClick={() => selectSuggestion(s)}
                              className="flex min-h-[48px] w-full items-center py-3 text-left font-serif text-lg font-light leading-snug text-samara-mute transition-colors duration-300 hover:text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold"
                            >
                              {s}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <section
                    className={shownSuggestions.length > 0 ? 'md:col-span-8 lg:col-span-9' : 'md:col-span-12'}
                    aria-labelledby="sm-search-products"
                  >
                    <div className="mb-6 flex items-baseline justify-between gap-6">
                      <p id="sm-search-products" className="sm-eyebrow">
                        {products.length > 0 ? `Pieces · ${countLabel}` : 'Pieces'}
                      </p>
                      {pending && products.length === 0 && (
                        <span className="font-sans text-xs text-samara-mute">Searching…</span>
                      )}
                    </div>

                    {visible.length > 0 && (
                      <ul
                        className={cn(
                          'grid grid-cols-2 gap-x-4 gap-y-10 transition-opacity duration-300 md:gap-x-6 md:gap-y-14',
                          shownSuggestions.length > 0 ? 'lg:grid-cols-3 xl:grid-cols-4' : 'md:grid-cols-3 lg:grid-cols-4',
                          pending && 'opacity-60',
                        )}
                      >
                        {visible.map((product, i) => (
                          <li key={product.id} className="sm-stagger" style={{ ['--i' as string]: i }}>
                            <ResultCard product={product} price={prices[product.id]} onNavigate={close} />
                          </li>
                        ))}
                      </ul>
                    )}

                    {products.length > 0 && (
                      <div className="mt-14 border-t border-samara-line pt-8">
                        <Link
                          href={searchHref(query)}
                          onClick={close}
                          className="sm-link inline-flex min-h-[44px] items-center font-sans text-xs uppercase tracking-eyebrow text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold"
                        >
                          View all results ({countLabel})
                        </Link>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function BrowseLinks({
  onNavigate,
  compact = false,
  offset = 0,
}: {
  onNavigate: () => void;
  compact?: boolean;
  offset?: number;
}) {
  return (
    <nav aria-label="Browse">
      <p className="sm-eyebrow sm-stagger mb-5 md:mb-8" style={{ ['--i' as string]: offset }}>
        Browse
      </p>
      <ul className={cn('flex flex-col', compact ? 'gap-2' : 'gap-3 md:gap-4')}>
        {BROWSE_LINKS.map((link, i) => (
          <li key={link.href} className="sm-stagger" style={{ ['--i' as string]: offset + i + 1 }}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className={cn(
                'group inline-flex min-h-[44px] items-baseline gap-4 font-serif font-light text-samara-ivory/80 transition-colors duration-300 hover:text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold md:gap-6',
                compact
                  ? 'text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.1]'
                  : 'text-[clamp(2.25rem,5.2vw,4.5rem)] leading-[1.02]',
              )}
            >
              <span className="w-6 font-sans text-[11px] tabular-nums tracking-eyebrow text-samara-mute md:w-8">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="sm-link">{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ResultCard({
  product,
  price,
  onNavigate,
}: {
  product: SearchProduct;
  price?: ResolvedPrice;
  onNavigate: () => void;
}) {
  const showPrice = price && price.displayPrice > 0;
  return (
    <Link
      href={`/products/${product.slug}`}
      onClick={onNavigate}
      className="group block focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-samara-gold"
    >
      <div className="sm-zoom relative aspect-[3/4] bg-samara-char">
        {product.primary_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- same plain <img> pattern as ProductSection
          <img
            src={product.primary_image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-serif text-sm italic text-samara-mute/60">Samara</span>
          </div>
        )}
      </div>
      <h3 className="mt-4 line-clamp-2 font-serif text-lg font-light leading-snug tracking-normal text-samara-ivory md:text-xl">
        {product.name}
      </h3>
      <div className="mt-1.5 flex min-h-[1.25rem] items-baseline gap-2 font-sans text-[13px] tabular-nums">
        {showPrice ? (
          <>
            <span className="text-samara-ivory/90">
              {formatPriceSync(price.displayPrice, price.currency)}
            </span>
            {price.mrp && price.mrp > price.displayPrice && (
              <span className="text-samara-mute line-through decoration-samara-mute/60">
                {formatPriceSync(price.mrp, price.currency)}
              </span>
            )}
          </>
        ) : (
          !price && <span aria-hidden className="mt-2 block h-px w-14 bg-samara-line" />
        )}
      </div>
    </Link>
  );
}
