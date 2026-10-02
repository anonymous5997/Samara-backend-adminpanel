'use client';

import type { SiteImage } from '@/lib/site-images/slots';
import { useCart } from '@/lib/cart-context';
import { useEffect, useMemo, useState } from 'react';
import { getSareeProducts, type ProductWithImages } from '@/lib/content';
import { Check, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { ListingHero, PieceCount } from '@/components/listing/ListingHero';
import { ListingProductCard } from '@/components/listing/ListingProductCard';
import { ListingEmpty, ListingSkeleton } from '@/components/listing/ListingEmpty';

/* -----------------------------------------------------------
   ✅ CURRENCY UTILS
----------------------------------------------------------- */
import { 
  getCurrencyRates, 
  formatPriceSync 
} from '@/lib/currency-utils';
import type { SupportedCurrency } from '@/lib/currency-utils';

/* -----------------------------------------------------------
   ✅ PRICE RESOLVER & REGION
----------------------------------------------------------- */
import { resolveFinalPrice } from '@/lib/resolve-product-price';
import { getUserRegion } from '@/lib/region/client';

export default function SareesPage({ headerImage = null }: { headerImage?: SiteImage | null }) {
  // ------------------------------------------------------------------
  // STATE MANAGEMENT
  // ------------------------------------------------------------------
  
  // Mobile Filter UI State
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sort State
  type SortOption =
    | 'relevance'
    | 'price_low_high'
    | 'price_high_low'
    | 'newest';

  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  // Product Data
  const [allProducts, setAllProducts] = useState<ProductWithImages[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Selections
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);

  // Price Slider State 
  const [priceMinDisplayed, setPriceMinDisplayed] = useState<number>(0);
  const [priceMaxDisplayed, setPriceMaxDisplayed] = useState<number>(100000); 
  const [priceRangeDraft, setPriceRangeDraft] = useState<[number, number]>([0, 100000]);
  const [priceRangeApplied, setPriceRangeApplied] = useState<[number, number]>([0, 100000]);
  const [priceReady, setPriceReady] = useState(false);
  
  // Region & Rates
  const region = getUserRegion();
  const [rates, setRates] = useState<Record<SupportedCurrency, number> | null>(null);
  
  // Display Currency State
  const [displayCurrency, setDisplayCurrency] = useState<SupportedCurrency>('INR');

  // Price Map
  const [priceMap, setPriceMap] = useState<
    Record<
      string,
      {
        price: number;
        currency: SupportedCurrency;
        mrp: number | null;
        discountPct: number;
      }
    >
  >({});

  // ------------------------------------------------------------------
  // 1. FETCH CURRENCY RATES
  // ------------------------------------------------------------------
  useEffect(() => {
    getCurrencyRates()
      .then((fetchedRates) => {
        if (fetchedRates) setRates(fetchedRates);
      })
      .catch(console.error);
  }, []);

  // ------------------------------------------------------------------
  // 2. LOAD PRODUCTS
  // ------------------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const products = await getSareeProducts();
        setAllProducts(products);
        setFilteredProducts(products);
      } catch (err) {
        console.error('Error loading sarees:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ------------------------------------------------------------------
  // 3. RESOLVE PRICES
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!allProducts.length) return;
    if (region !== 'IN' && !rates) return;

    const loadPrices = async () => {
      const promises = allProducts.map(async (product) => {
        try {
          const resolved = await resolveFinalPrice(product, region, undefined, rates ?? undefined);
          
          if (resolved && resolved.displayPrice > 0) {
            return [
              product.id,
              {
                price: resolved.displayPrice,
                currency: resolved.currency as SupportedCurrency,
                mrp: resolved.mrp,
                discountPct: resolved.discountPct ?? 0,
              }
            ] as const;
          }
          return null;
        } catch (error) {
          console.error(`Failed to resolve price for ${product.id}`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);

      const map = Object.fromEntries(
        results.filter((item): item is [string, any] => item !== null)
      );

      setPriceMap(map);

      const firstResolvedCurrency = Object.values(map)[0]?.currency;
      if (firstResolvedCurrency) {
        setDisplayCurrency(firstResolvedCurrency);
      }
    };

    loadPrices();
  }, [allProducts, region, rates]);

  // ------------------------------------------------------------------
  // 4. INITIALIZE SLIDER BOUNDS
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!allProducts.length) return;
    if (Object.keys(priceMap).length === 0) return;
    
    const currentPrices = allProducts
      .map(p => priceMap[p.id]?.price ?? 0)
      .filter(p => p > 0);

    if (!currentPrices.length) return;

    const min = Math.floor(Math.min(...currentPrices));
    const max = Math.ceil(Math.max(...currentPrices));
    const bufferMax = Math.ceil(max * 1.10); 

    setPriceMinDisplayed(min);
    setPriceMaxDisplayed(bufferMax);

    setPriceRangeDraft([min, bufferMax]);
    setPriceRangeApplied([min, bufferMax]);
    
    setPriceReady(true);
    
  }, [allProducts, priceMap]);

  // ------------------------------------------------------------------
  // 5. MEMOIZE FILTER OPTIONS
  // ------------------------------------------------------------------
  const fabricOptions = useMemo<string[]>(() => 
    Array.from(
      new Set(
        allProducts
          .map(p => p.fabric?.trim())
          .filter((v): v is string => Boolean(v))
      )
    ).sort(),
    [allProducts]
  );

  const colorOptions = useMemo<string[]>(() => 
    Array.from(
      new Set(
        allProducts
          .map(p => p.color?.trim())
          .filter((v): v is string => Boolean(v))
      )
    ).sort(),
    [allProducts]
  );

  const occasionOptions = useMemo<string[]>(() => 
    Array.from(
      new Set(
        allProducts
          .map(p => p.occasion?.trim())
          .filter((v): v is string => Boolean(v))
      )
    ).sort(),
    [allProducts]
  );

  // ------------------------------------------------------------------
  // 6. APPLY FILTERS & SORTING
  // ------------------------------------------------------------------
  useEffect(() => {
    if (Object.keys(priceMap).length === 0 && allProducts.length > 0) return;

    let current = [...allProducts];

    // Filter: Fabric
    if (selectedFabrics.length > 0) {
      current = current.filter((p) => p.fabric && selectedFabrics.includes(p.fabric.trim()));
    }
    // Filter: Color
    if (selectedColors.length > 0) {
      current = current.filter((p) => p.color && selectedColors.includes(p.color.trim()));
    }
    // Filter: Occasion
    if (selectedOccasions.length > 0) {
      current = current.filter((p) => p.occasion && selectedOccasions.includes(p.occasion.trim()));
    }

    // Filter: Price
    if (priceReady) {
      const [minSelected, maxSelected] = priceRangeApplied;
      current = current.filter((p) => {
        const productPrice = priceMap[p.id]?.price ?? 0;
        return productPrice >= minSelected && productPrice <= maxSelected;
      });
    }

    // Sort Logic
    if (sortBy !== 'relevance') {
      current = [...current].sort((a, b) => {
        const priceA = priceMap[a.id]?.price ?? 0;
        const priceB = priceMap[b.id]?.price ?? 0;

        switch (sortBy) {
          case 'price_low_high':
            return priceA - priceB;

          case 'price_high_low':
            return priceB - priceA;

          case 'newest':
            return (
              new Date(b.created_at || '').getTime() -
              new Date(a.created_at || '').getTime()
            );

          default:
            return 0;
        }
      });
    }

    setFilteredProducts(current);
    
  }, [
    allProducts, 
    selectedFabrics, 
    selectedColors, 
    selectedOccasions, 
    priceRangeApplied,
    priceReady, 
    priceMap,
    sortBy
  ]);

  const toggleValue = (value: string, list: string[], setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const getPercent = (value: number) => {
    const min = priceMinDisplayed;
    const max = priceMaxDisplayed;
    if (max === min) return 0;
    return Math.round(((value - min) / (max - min)) * 100);
  };

  const minPercent = getPercent(priceRangeDraft[0]);
  const maxPercent = getPercent(priceRangeDraft[1]);


  const activeFilterCount = selectedFabrics.length + selectedColors.length + selectedOccasions.length;

  const RANGE_INPUT =
    'pointer-events-none absolute inset-0 m-0 h-full w-full appearance-none bg-transparent p-0 focus-visible:outline-none ' +
    '[&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent ' +
    '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-samara-gold [&::-webkit-slider-thumb]:bg-samara-ivory ' +
    '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-samara-gold [&::-moz-range-thumb]:bg-samara-ivory ' +
    'focus-visible:[&::-webkit-slider-thumb]:bg-samara-gold focus-visible:[&::-moz-range-thumb]:bg-samara-gold';

  const CHECKBOX =
    'h-4 w-4 shrink-0 cursor-pointer appearance-none border border-samara-ivory/40 bg-transparent transition-colors duration-300 ' +
    'checked:border-samara-gold checked:bg-samara-gold checked:shadow-[inset_0_0_0_3px_#101914] ' +
    'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold';

  const optionGroups: Array<{ title: string; options: string[]; selected: string[]; setter: (next: string[]) => void }> = [
    { title: 'Fabric', options: fabricOptions, selected: selectedFabrics, setter: setSelectedFabrics },
    { title: 'Color', options: colorOptions, selected: selectedColors, setter: setSelectedColors },
    { title: 'Occasion', options: occasionOptions, selected: selectedOccasions, setter: setSelectedOccasions },
  ];

  // ------------------------------------------------------------------
  // 7. SHARED FILTER CONTENT (Desktop Sidebar + Mobile Sheet)
  // ------------------------------------------------------------------
  const FilterContent = (
    <div className="divide-y divide-samara-line border-y border-samara-line">
      {/* Price Filter */}
      <div className="py-7">
        <p className="sm-eyebrow mb-6 text-samara-ivory">Price</p>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="border border-samara-line px-3 py-2.5">
            <span className="block font-sans text-[0.625rem] uppercase tracking-[0.2em] text-samara-mute">Min</span>
            <span className="mt-1 block font-sans text-sm tabular-nums text-samara-ivory">
              {formatPriceSync(priceRangeDraft[0], displayCurrency)}
            </span>
          </div>
          <div className="border border-samara-line px-3 py-2.5">
            <span className="block font-sans text-[0.625rem] uppercase tracking-[0.2em] text-samara-mute">Max</span>
            <span className="mt-1 block font-sans text-sm tabular-nums text-samara-ivory">
              {formatPriceSync(priceRangeDraft[1], displayCurrency)}
            </span>
          </div>
        </div>

        <div className="relative mx-2 h-6">
          <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-samara-ivory/20" />
          <div
            className="absolute top-1/2 h-px -translate-y-1/2 bg-samara-gold"
            style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
          />

          <input
            type="range"
            aria-label="Minimum price"
            min={priceMinDisplayed}
            max={priceMaxDisplayed}
            value={priceRangeDraft[0]}
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), priceRangeDraft[1] - 1);
              setPriceRangeDraft([val, priceRangeDraft[1]]);
            }}
            className={`${RANGE_INPUT} z-20`}
          />

          <input
            type="range"
            aria-label="Maximum price"
            min={priceMinDisplayed}
            max={priceMaxDisplayed}
            value={priceRangeDraft[1]}
            onChange={(e) => {
              const val = Math.max(Number(e.target.value), priceRangeDraft[0] + 1);
              setPriceRangeDraft([priceRangeDraft[0], val]);
            }}
            className={`${RANGE_INPUT} z-30`}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="sm-btn sm-btn-ghost min-h-[44px] px-3 text-[0.6875rem]"
            onClick={() => {
              setPriceRangeDraft([priceMinDisplayed, priceMaxDisplayed]);
              setPriceRangeApplied([priceMinDisplayed, priceMaxDisplayed]);
            }}
          >
            Reset
          </button>
          <button
            type="button"
            className="sm-btn min-h-[44px] bg-samara-gold px-3 text-[0.6875rem] text-samara-cream-ink hover:bg-samara-ivory"
            onClick={() => {
              setPriceRangeApplied(priceRangeDraft);
              const el = document.querySelector('#products-grid');
              if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 120;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }}
          >
            Apply
          </button>
        </div>
      </div>

      {/* Fabric / Color / Occasion Filters */}
      {optionGroups.map((group) =>
        group.options.length === 0 ? null : (
          <fieldset key={group.title} className="py-7">
            <legend className="sm-eyebrow float-left mb-4 w-full text-samara-ivory">{group.title}</legend>
            <div className="clear-left">
              {group.options.map((option) => (
                <label
                  key={option}
                  className="flex min-h-[44px] cursor-pointer items-center gap-3.5 py-1 font-sans text-sm capitalize text-samara-mute transition-colors hover:text-samara-ivory has-[:checked]:text-samara-ivory"
                >
                  <input
                    type="checkbox"
                    className={CHECKBOX}
                    checked={group.selected.includes(option)}
                    onChange={() => toggleValue(option, group.selected, group.setter)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ),
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-samara-black text-samara-ivory">
      {/* HERO */}
      <ListingHero
        eyebrow="The Saree Edit"
        title={
          <>
            The <span className="sm-accent">Sarees</span>
          </>
        }
        intro="Explore our curated saree collection"
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Sarees' }]}
        meta={!loading && allProducts.length > 0 ? <PieceCount count={allProducts.length} /> : null}
        image={headerImage}
      />

      {/* MOBILE FILTER BAR */}
      <div className="sticky top-[60px] z-30 border-b border-samara-line bg-samara-black/95 backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-2 divide-x divide-samara-line">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex min-h-[52px] items-center justify-center gap-2.5 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-samara-ivory active:bg-samara-char"
          >
            <SlidersHorizontal aria-hidden className="h-4 w-4" strokeWidth={1.25} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-samara-gold px-1 text-[0.625rem] tracking-normal text-samara-cream-ink">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileSortOpen(true)}
            className="flex min-h-[52px] items-center justify-center gap-2.5 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-samara-ivory active:bg-samara-char"
          >
            Sort
            <ChevronDown aria-hidden className="h-4 w-4" strokeWidth={1.25} />
          </button>
        </div>
      </div>

      {/* LISTING + FILTERS */}
      <section className="pb-[clamp(4rem,8vw,7.5rem)] pt-8 md:pt-12">
        <div className="sm-container">
          <div className="flex flex-col gap-10 lg:flex-row lg:gap-12 xl:gap-16">
            {/* ------------------- SIDEBAR FILTERS (DESKTOP) ------------------- */}
            <aside className="hidden flex-shrink-0 lg:block lg:w-60 xl:w-64" aria-label="Filters">
              <div className="sticky top-[calc(72px+2rem)] max-h-[calc(100vh-72px-4rem)] overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
                <p className="mb-6 font-serif text-2xl font-light text-samara-ivory">Refine</p>
                {FilterContent}
              </div>
            </aside>

            {/* ------------------- PRODUCT GRID ------------------- */}
            <div className="min-w-0 flex-1">
              {/* Count + desktop sort */}
              <div className="mb-8 flex items-center justify-between gap-4 md:mb-10">
                <p className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-samara-mute" aria-live="polite">
                  <span className="text-samara-ivory tabular-nums">{filteredProducts.length}</span> products
                </p>

                <label className="hidden items-center gap-4 lg:flex">
                  <span className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-samara-mute">Sort By</span>
                  <span className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="h-11 cursor-pointer appearance-none border border-samara-line bg-samara-black pl-4 pr-10 font-sans text-[0.8125rem] text-samara-ivory transition-colors hover:border-samara-ivory/40 focus:outline-none focus-visible:border-samara-gold"
                    >
                      {SORT_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-samara-mute"
                      strokeWidth={1.25}
                    />
                  </span>
                </label>
              </div>

              {loading ? (
                <div role="status">
                  <span className="sr-only">Loading sarees...</span>
                  <ListingSkeleton count={4} className={SAREES_GRID} />
                </div>
              ) : filteredProducts.length === 0 ? (
                <ListingEmpty
                  title="No sarees match your filters."
                  actions={[{ label: 'Shop All', href: '/shop', variant: 'ghost' }]}
                />
              ) : (
                <div id="products-grid" className={SAREES_GRID}>
                  {filteredProducts.map((product, index) => {
                    const resolved = priceMap[product.id];
                    const badges = product.is_bestseller
                      ? [product.bestseller_badge_label || 'Bestseller']
                      : product.is_new_arrival
                        ? ['New']
                        : [];
                    return (
                      <ListingProductCard
                        key={product.id}
                        product={product}
                        index={index}
                        badges={badges}
                        price={resolved ? { price: resolved.price, currency: resolved.currency, mrp: resolved.mrp } : undefined}
                        sizes="(min-width: 1280px) 19vw, (min-width: 1024px) 24vw, (min-width: 768px) 31vw, 47vw"
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE FILTER BOTTOM SHEET */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[1100] flex justify-end lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] motion-safe:animate-[sm-overlay-in_300ms_ease-out_both]" onClick={() => setMobileFiltersOpen(false)} />

          {/* Sheet */}
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col border-t border-samara-line bg-samara-ink motion-safe:animate-[sm-rise_500ms_cubic-bezier(0.22,1,0.36,1)_both]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-baseline gap-3">
                <h3 className="font-serif text-2xl font-normal text-samara-ivory">Filters</h3>
                <span className="sm-eyebrow tabular-nums">{filteredProducts.length} products</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="-mr-2 flex h-11 w-11 items-center justify-center text-samara-mute transition-colors hover:text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold"
              >
                <X className="h-5 w-5" strokeWidth={1.25} />
              </button>
            </div>

            {/* Filter Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-5">{FilterContent}</div>

            {/* Footer Apply Button */}
            <div className="border-t border-samara-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="sm-btn w-full bg-samara-gold text-samara-cream-ink hover:bg-samara-ivory"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE SORT BOTTOM SHEET */}
      {mobileSortOpen && (
        <div className="fixed inset-0 z-[1100] lg:hidden" role="dialog" aria-modal="true" aria-label="Sort by">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] motion-safe:animate-[sm-overlay-in_300ms_ease-out_both]" onClick={() => setMobileSortOpen(false)} />

          <div className="absolute inset-x-0 bottom-0 border-t border-samara-line bg-samara-ink pb-[env(safe-area-inset-bottom)] motion-safe:animate-[sm-rise_500ms_cubic-bezier(0.22,1,0.36,1)_both]">
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="font-serif text-2xl font-normal text-samara-ivory">Sort By</h3>
              <button
                type="button"
                onClick={() => setMobileSortOpen(false)}
                aria-label="Close sort"
                className="-mr-2 flex h-11 w-11 items-center justify-center text-samara-mute transition-colors hover:text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold"
              >
                <X className="h-5 w-5" strokeWidth={1.25} />
              </button>
            </div>

            <div className="border-t border-samara-line px-5 pb-4">
              {SORT_OPTIONS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSortBy(value as any);
                    setMobileSortOpen(false);
                  }}
                  aria-pressed={sortBy === value}
                  className={`flex min-h-[56px] w-full items-center justify-between border-b border-samara-line text-left font-sans text-sm transition-colors ${
                    sortBy === value ? 'text-samara-gold' : 'text-samara-ivory/80 hover:text-samara-ivory'
                  }`}
                >
                  {label}
                  {sortBy === value && <Check aria-hidden className="h-4 w-4" strokeWidth={1.5} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SAREES_GRID =
  'grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 md:gap-x-6 md:gap-y-14 xl:grid-cols-4';

const SORT_OPTIONS = [
  ['relevance', 'Relevance'],
  ['price_low_high', 'Price: Low to High'],
  ['price_high_low', 'Price: High to Low'],
  ['newest', 'Newest First'],
] as const;
