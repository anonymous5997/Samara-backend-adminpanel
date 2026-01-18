'use client';

import { useCart } from '@/lib/cart-context';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSareeProducts, type ProductWithImages } from '@/lib/content';
import { Star, Sparkles, ChevronDown, Filter, X } from 'lucide-react';

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

export default function SareesPage() {
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

  // ------------------------------------------------------------------
  // 7. SHARED FILTER CONTENT (Desktop Sidebar + Mobile Sheet)
  // ------------------------------------------------------------------
  const FilterContent = (
    <div className="space-y-4">
      {/* Price Filter */}
      <div className="bg-[#0b0b0b] border-2 border-[#D4AF37]/20 rounded-lg p-6 hover:border-[#D4AF37]/40 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <span className="font-serif text-lg font-semibold text-[#D4AF37]">Price</span>
          <ChevronDown className="h-5 w-5 text-[#D4AF37]" />
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center text-sm text-gray-300">
            <div>Min: <span className="font-semibold text-[#D4AF37]">{formatPriceSync(priceRangeDraft[0], displayCurrency)}</span></div>
            <div>Max: <span className="font-semibold text-[#D4AF37]">{formatPriceSync(priceRangeDraft[1], displayCurrency)}</span></div>
          </div>

          <div className="relative h-6 w-full">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-700 rounded-full -translate-y-1/2 z-0"></div>
            <div 
              className="absolute top-1/2 h-1 bg-[#D4AF37] rounded-full -translate-y-1/2 z-10"
              style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
            ></div>

            {/* Note: Standard Range Inputs without custom styling for now */}
            <input
              type="range"
              min={priceMinDisplayed}
              max={priceMaxDisplayed}
              value={priceRangeDraft[0]}
              onChange={(e) => {
                const val = Math.min(Number(e.target.value), priceRangeDraft[1] - 1);
                setPriceRangeDraft([val, priceRangeDraft[1]]);
              }}
              className="absolute top-0 left-0 w-full h-full appearance-none bg-transparent z-20 m-0 p-0 pointer-events-auto"
            />

            <input
              type="range"
              min={priceMinDisplayed}
              max={priceMaxDisplayed}
              value={priceRangeDraft[1]}
              onChange={(e) => {
                const val = Math.max(Number(e.target.value), priceRangeDraft[0] + 1);
                setPriceRangeDraft([priceRangeDraft[0], val]);
              }}
              className="absolute top-0 left-0 w-full h-full appearance-none bg-transparent z-30 m-0 p-0 pointer-events-auto"
            />
          </div>

          <div className="flex gap-2">
            <button
              className="flex-1 px-3 py-2 rounded bg-[#111] border border-[#D4AF37]/20 text-xs text-gray-400 hover:text-white transition-colors"
              onClick={() => {
                setPriceRangeDraft([priceMinDisplayed, priceMaxDisplayed]);
                setPriceRangeApplied([priceMinDisplayed, priceMaxDisplayed]);
              }}
            >
              Reset
            </button>
            <button
              className="flex-1 px-3 py-2 rounded bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 transition-all"
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
      </div>

      {/* Fabric Filter */}
      <div className="bg-[#0b0b0b] border-2 border-[#D4AF37]/20 rounded-lg p-6 hover:border-[#D4AF37]/40 transition-all duration-300">
        <div className="w-full flex items-center justify-between mb-4">
          <span className="font-serif text-lg font-semibold text-[#D4AF37]">Fabric</span>
          <ChevronDown className="h-5 w-5 text-[#D4AF37]" />
        </div>
        <div className="space-y-2">
          {fabricOptions.map((fabric) => (
            <label key={fabric} className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-[#D4AF37]/30 accent-[#D4AF37]"
                checked={selectedFabrics.includes(fabric)}
                onChange={() => toggleValue(fabric, selectedFabrics, setSelectedFabrics)}
              />
              <span className="text-sm">{fabric}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Color Filter */}
      <div className="bg-[#0b0b0b] border-2 border-[#D4AF37]/20 rounded-lg p-6 hover:border-[#D4AF37]/40 transition-all duration-300">
        <div className="w-full flex items-center justify-between mb-4">
          <span className="font-serif text-lg font-semibold text-[#D4AF37]">Color</span>
          <ChevronDown className="h-5 w-5 text-[#D4AF37]" />
        </div>
        <div className="space-y-2">
          {colorOptions.map((color) => (
            <label key={color} className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-[#D4AF37]/30 accent-[#D4AF37]"
                checked={selectedColors.includes(color)}
                onChange={() => toggleValue(color, selectedColors, setSelectedColors)}
              />
              <span className="text-sm">{color}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Occasion Filter */}
      <div className="bg-[#0b0b0b] border-2 border-[#D4AF37]/20 rounded-lg p-6 hover:border-[#D4AF37]/40 transition-all duration-300">
        <div className="w-full flex items-center justify-between mb-4">
          <span className="font-serif text-lg font-semibold text-[#D4AF37]">Occasion</span>
          <ChevronDown className="h-5 w-5 text-[#D4AF37]" />
        </div>
        <div className="space-y-2">
          {occasionOptions.map((occasion) => (
            <label key={occasion} className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-[#D4AF37]/30 accent-[#D4AF37]"
                checked={selectedOccasions.includes(occasion)}
                onChange={() => toggleValue(occasion, selectedOccasions, setSelectedOccasions)}
              />
              <span className="text-sm">{occasion}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-black text-white min-h-screen">
      {/* HERO SECTION */}
      {/* ✅ STEP 1: Desktop padding reduced (md:pb-12), Mobile (pt-14 pb-8) maintained */}
      <section className="pt-14 pb-8 md:pt-20 md:pb-12 bg-gradient-to-b from-black to-[#0b0b0b] border-b border-[#D4AF37]/10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] tracking-tighter">
              Sarees
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mt-2 mb-4 md:mb-8">
              Explore our curated saree collection
            </p>
          </div>
        </div>
      </section>

      {/* LISTING + FILTERS */}
      {/* ✅ STEP 2: Desktop listing pulled up (md:pt-6) */}
      <section className="pt-4 pb-12 md:pt-6 md:pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* ------------------- SIDEBAR FILTERS (DESKTOP) ------------------- */}
            <aside className="hidden lg:block lg:w-72 flex-shrink-0">
              {/* ✅ STEP 3: Sticky offset reduced to top-20 */}
              <div className="sticky top-20">
                {FilterContent}
              </div>
            </aside>

            {/* ------------------- PRODUCT GRID ------------------- */}
            <div className="flex-1">
              
              {/* MOBILE FILTER BAR & COUNT */}
              <div className="lg:hidden flex items-center justify-between gap-3 mb-2">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                             bg-[#0b0b0b] border border-[#D4AF37]/30 text-[#D4AF37]
                             font-semibold text-sm active:bg-[#1a1a1a]"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>

                <button
                  onClick={() => setMobileSortOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                             bg-[#0b0b0b] border border-[#D4AF37]/30 text-[#D4AF37]
                             font-semibold text-sm active:bg-[#1a1a1a]"
                >
                  <ChevronDown className="w-4 h-4" />
                  Sort
                </button>
              </div>

              {/* Product Count */}
              {/* ✅ STEP 4: Reduced margin below count (md:mb-2) */}
              <div className="mb-4 md:mb-2">
                <p className="text-gray-400 text-sm md:text-lg">
                  <span className="text-[#D4AF37] font-semibold">{filteredProducts.length}</span> products
                </p>
              </div>

              {loading ? (
                <div className="text-center py-20 bg-[#0b0b0b] border-2 border-[#D4AF37]/20 rounded-lg">
                  <p className="text-gray-500 text-lg">Loading sarees...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-[#0b0b0b] border-2 border-[#D4AF37]/20 rounded-lg">
                  <p className="text-gray-500 text-lg">No sarees match your filters.</p>
                </div>
              ) : (
                <div
                  id="products-grid"
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                >
                  {filteredProducts.map((product) => (
                    <Link key={product.id} href={`/products/${product.slug}`}>
                      <div className="group relative bg-black rounded-lg overflow-hidden border-2 border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/40 transition-all duration-500 hover:-translate-y-2">
                        
                        <div className="aspect-[2/3] md:aspect-[3/4] relative overflow-hidden bg-[#111111]">
                          <img
                            src={product.primary_image_url || ''}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                          {product.is_bestseller && (
                            <div className="absolute top-3 left-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/50">
                              <Star className="h-3 w-3 fill-current" />
                              {product.bestseller_badge_label || 'Bestseller'}
                            </div>
                          )}

                          {product.is_new_arrival && !product.is_bestseller && (
                            <div className="absolute top-3 right-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/50">
                              <Sparkles className="h-3 w-3" />
                              New
                            </div>
                          )}
                        </div>

                        <div className="p-3 md:p-4 bg-gradient-to-b from-black to-[#0b0b0b]">
                          <h3 className="font-serif text-base md:text-lg font-semibold mb-1 line-clamp-1 text-[#D4AF37] group-hover:text-[#F4D03F] transition-colors">
                            {product.name}
                          </h3>
                          {product.brand && <p className="text-xs text-gray-500 mb-2">{product.brand}</p>}
                          
                          {(() => {
                            const resolved = priceMap[product.id];
                            if (!resolved) return <div className="h-6 w-24 bg-gray-800 animate-pulse rounded" />;

                            return (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-lg md:text-xl font-bold text-[#D4AF37]">
                                    {formatPriceSync(resolved.price, resolved.currency)}
                                  </p>

                                  {resolved.mrp && resolved.mrp > resolved.price && (
                                    <p className="text-xs md:text-sm text-gray-500 line-through">
                                      {formatPriceSync(resolved.mrp, resolved.currency)}
                                    </p>
                                  )}

                                  {resolved.discountPct > 0 && (
                                    <span className="text-[10px] md:text-xs font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded ml-auto">
                                      {resolved.discountPct}% OFF
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE FILTER BOTTOM SHEET */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileFiltersOpen(false)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-[#0a0a0a] rounded-t-2xl border-t border-[#D4AF37]/30 flex flex-col shadow-2xl transition-transform duration-300 translate-y-0">
            
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10 rounded-t-2xl">
              <h3 className="font-serif text-lg font-bold text-[#D4AF37] flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 text-gray-400 hover:text-white bg-gray-900 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Content (Scrollable) */}
            <div className="p-5 overflow-y-auto overflow-x-hidden flex-1 space-y-6">
              {FilterContent}
            </div>

            {/* Footer Apply Button */}
            <div className="p-4 bg-[#0a0a0a] border-t border-gray-800 sticky bottom-0 z-10 pb-[env(safe-area-inset-bottom)]">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3.5 rounded-lg
                           bg-gradient-to-r from-[#D4AF37] to-[#F4D03F]
                           text-black font-bold tracking-wide shadow-lg shadow-[#D4AF37]/20"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE SORT BOTTOM SHEET */}
      {mobileSortOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setMobileSortOpen(false)}
          />

          <div className="absolute bottom-0 left-0 right-0 bg-[#0a0a0a] rounded-t-2xl border-t border-[#D4AF37]/30">
            <div className="p-4 border-b border-gray-800 font-serif text-lg text-[#D4AF37]">
              Sort By
            </div>

            {[
              ['relevance', 'Relevance'],
              ['price_low_high', 'Price: Low to High'],
              ['price_high_low', 'Price: High to Low'],
              ['newest', 'Newest First'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => {
                  setSortBy(value as any);
                  setMobileSortOpen(false);
                }}
                className={`w-full px-4 py-4 text-left border-b border-gray-800
                  ${sortBy === value
                    ? 'text-[#D4AF37] font-bold'
                    : 'text-gray-300'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}