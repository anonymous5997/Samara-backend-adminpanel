'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { CATALOG_CARD_SIZES } from '@/components/catalog/CatalogGrid';
import { useProductSearch } from '@/hooks/useProductSearch';
import type { SearchProduct } from '@/hooks/useProductSearch';
import { useCart } from '@/lib/cart-context';
import { resolveFinalPrice } from '@/lib/resolve-product-price';
import type { ResolvedPrice } from '@/lib/resolve-product-price';
import { getUserRegion } from '@/lib/region/client';
import { getCurrencyRates } from '@/lib/currency/get-currency-rates';
import { cn } from '@/lib/utils';

/**
 * Prices resolved exactly as components/ProductSection.tsx and the search
 * overlay do: rates once, then resolveFinalPrice(product, region, currency, rates),
 * catching errors per product.
 */
function useSearchPrices(products: SearchProduct[]) {
  const { currency } = useCart();
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [priceMap, setPriceMap] = useState<Record<string, ResolvedPrice>>({});

  useEffect(() => {
    getCurrencyRates()
      .then(setRates)
      .catch((err) => console.error('Failed to load currency rates:', err));
  }, []);

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

function SearchView({ urlQuery }: { urlQuery: string | null }) {
  const {
    searchQuery,
    setSearchQuery,
    products,
    suggestions,
    loading,
    selectSuggestion,
    clearSearch,
  } = useProductSearch(urlQuery ?? '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Follow ?q= when it changes while this page is open (e.g. from the search overlay).
  useEffect(() => {
    if (urlQuery !== null) setSearchQuery(urlQuery);
  }, [urlQuery, setSearchQuery]);

  const handleSuggestionClick = (suggestion: string) => {
    setShowSuggestions(false);
    selectSuggestion(suggestion);
  };

  const prices = useSearchPrices(products);
  const suggestionsVisible = showSuggestions && suggestions.length > 0;

  return (
    <div className="min-h-screen bg-samara-black pb-24 text-samara-ivory md:pb-32">
      <div className="sm-container pt-10 md:pt-16 lg:pt-20">
        <h1 className="sm-eyebrow flex items-center gap-4 !tracking-eyebrow">
          Search Products
          <span aria-hidden className="h-px w-10 bg-samara-mute/50" />
        </h1>

        <div role="search" className="mt-6 md:mt-12">
          <label htmlFor="sm-search-page-input" className="sr-only">
            Search for sarees, collections, brands
          </label>
          <div className="relative flex items-end gap-4">
            <input
              id="sm-search-page-input"
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search for sarees, collections, brands..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="min-w-0 flex-1 appearance-none rounded-none border-0 bg-transparent pb-3 font-serif font-light leading-[1.05] text-samara-ivory caret-samara-gold outline-none placeholder:text-samara-mute/40 focus:outline-none focus:ring-0 md:pb-5 [&::-webkit-search-cancel-button]:hidden"
              style={{ fontSize: 'clamp(1.875rem, 6vw, 5rem)', letterSpacing: '-0.01em' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="mb-3 flex h-11 shrink-0 items-center gap-2 px-1 font-sans text-[11px] uppercase tracking-eyebrow text-samara-mute transition-colors duration-300 hover:text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold md:mb-5"
              >
                <span className="hidden md:inline">Clear</span>
                <X aria-hidden className="h-5 w-5 md:hidden" strokeWidth={1.25} />
              </button>
            )}
          </div>
          {/* Hairline underline + quiet progress line */}
          <div className="relative h-px w-full bg-samara-line">
            <div
              aria-hidden
              className={cn(
                'absolute inset-y-0 left-0 w-full origin-left bg-samara-ivory/60 ease-editorial motion-reduce:transition-none',
                searchQuery && loading
                  ? 'scale-x-100 opacity-100 transition-transform duration-1600'
                  : 'scale-x-0 opacity-0 transition-[opacity,transform] duration-300'
              )}
            />
          </div>

          {searchQuery && (
            <p className="mt-5 font-sans text-[11px] uppercase tracking-[0.2em] text-samara-mute" aria-live="polite">
              {loading ? 'Searching...' : `${products.length} results found`}
            </p>
          )}
        </div>

        <div className="pt-10 md:pt-16">
          {(suggestionsVisible || products.length > 0) && (
            <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10 lg:gap-16">
              {suggestionsVisible && (
                <section className="md:col-span-4 lg:col-span-3" aria-labelledby="sm-search-page-suggestions">
                  <p id="sm-search-page-suggestions" className="sm-eyebrow mb-4">
                    Suggestions
                  </p>
                  <ul className="border-t border-samara-line">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="border-b border-samara-line">
                        <button
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="flex min-h-[48px] w-full items-center py-3 text-left font-serif text-lg font-light leading-snug text-samara-mute transition-colors duration-300 hover:text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold"
                        >
                          {suggestion}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {products.length > 0 && (
                <section
                  className={suggestionsVisible ? 'md:col-span-8 lg:col-span-9' : 'md:col-span-12'}
                  aria-label="Results"
                >
                  <ul
                    className={cn(
                      'grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:gap-y-16',
                      suggestionsVisible
                        ? 'lg:grid-cols-3 lg:gap-x-8 min-[1440px]:grid-cols-3'
                        : 'lg:grid-cols-3 lg:gap-x-8 min-[1440px]:grid-cols-4 min-[1440px]:gap-x-10',
                      loading && 'opacity-60 transition-opacity duration-300'
                    )}
                  >
                    {products.map((product) => (
                      <li key={product.id}>
                        <ProductCard
                          product={product}
                          image={product.primary_image_url ? { image_url: product.primary_image_url } : undefined}
                          price={prices[product.id]}
                          sizes={CATALOG_CARD_SIZES}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {!loading && searchQuery && products.length === 0 && (
            <div className="max-w-xl">
              <p className="font-serif text-[clamp(1.5rem,2.4vw,2.25rem)] font-light leading-tight text-samara-ivory">
                No products <span className="sm-accent">found</span>
              </p>
              <p className="sm-body mt-3">Try different search terms or browse our collections</p>
              <Link
                href="/collections"
                className="sm-btn sm-btn-ghost mt-10"
              >
                Browse Collections
              </Link>
            </div>
          )}

          {!searchQuery && (
            <p className="font-serif text-[clamp(1.375rem,2.2vw,2rem)] font-light italic leading-snug text-samara-mute">
              Start typing to search for products
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchWithParams() {
  const params = useSearchParams();
  return <SearchView urlQuery={params.get('q')} />;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchView urlQuery={null} />}>
      <SearchWithParams />
    </Suspense>
  );
}
