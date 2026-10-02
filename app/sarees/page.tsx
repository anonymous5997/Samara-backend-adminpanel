'use client';

import { useCart } from '@/lib/cart-context';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSareeProducts, type ProductWithImages } from '@/lib/content';
import { Star, Sparkles, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '@/components/product-card';

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
  const [priceMap, setPriceMap] = useState<Record<string, import('@/lib/resolve-product-price').ResolvedPrice>>({});

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
              resolved
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
      .map(p => priceMap[p.id]?.displayPrice ?? 0)
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
        const productPrice = priceMap[p.id]?.displayPrice ?? 0;
        return productPrice >= minSelected && productPrice <= maxSelected;
      });
    }

    // Sort Logic
    if (sortBy !== 'relevance') {
      current = [...current].sort((a, b) => {
        const priceA = priceMap[a.id]?.displayPrice ?? 0;
        const priceB = priceMap[b.id]?.displayPrice ?? 0;

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
    <div className="space-y-10 pr-4">
      {/* Price Filter */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-gold">Price</span>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center text-[11px] font-sans tracking-widest text-samara-ivory/60">
            <div><span className="text-samara-gold">{formatPriceSync(priceRangeDraft[0], displayCurrency)}</span></div>
            <div><span className="text-samara-gold">{formatPriceSync(priceRangeDraft[1], displayCurrency)}</span></div>
          </div>

          <div className="relative h-6 w-full">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-samara-ivory/10 -translate-y-1/2 z-0"></div>
            <div 
              className="absolute top-1/2 h-[2px] bg-samara-gold -translate-y-1/2 z-10"
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
              className="flex-1 px-3 py-3 border border-samara-ivory/20 text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60 hover:text-samara-gold hover:border-samara-gold transition-colors"
              onClick={() => {
                setPriceRangeDraft([priceMinDisplayed, priceMaxDisplayed]);
                setPriceRangeApplied([priceMinDisplayed, priceMaxDisplayed]);
              }}
            >
              Reset
            </button>
            <button
              className="flex-1 px-3 py-3 bg-samara-gold text-samara-void text-[10px] font-sans tracking-[0.2em] uppercase hover:bg-samara-goldDeep transition-colors"
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
      <div className="space-y-6">
        <div className="w-full flex items-center justify-between mb-4">
          <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-gold">Fabric</span>
        </div>
        <div className="space-y-3">
          {fabricOptions.map((fabric) => (
            <label key={fabric} className="flex items-center gap-3 text-samara-ivory/70 hover:text-samara-gold cursor-pointer transition-colors group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded-none border-samara-ivory/30 bg-transparent text-samara-gold focus:ring-0 focus:ring-offset-0"
                checked={selectedFabrics.includes(fabric)}
                onChange={() => toggleValue(fabric, selectedFabrics, setSelectedFabrics)}
              />
              <span className="text-xs font-sans tracking-wide">{fabric}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Color Filter */}
      <div className="space-y-6">
        <div className="w-full flex items-center justify-between mb-4">
          <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-gold">Color</span>
        </div>
        <div className="space-y-3">
          {colorOptions.map((color) => (
            <label key={color} className="flex items-center gap-3 text-samara-ivory/70 hover:text-samara-gold cursor-pointer transition-colors group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded-none border-samara-ivory/30 bg-transparent text-samara-gold focus:ring-0 focus:ring-offset-0"
                checked={selectedColors.includes(color)}
                onChange={() => toggleValue(color, selectedColors, setSelectedColors)}
              />
              <span className="text-xs font-sans tracking-wide">{color}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Occasion Filter */}
      <div className="space-y-6">
        <div className="w-full flex items-center justify-between mb-4">
          <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-gold">Occasion</span>
        </div>
        <div className="space-y-3">
          {occasionOptions.map((occasion) => (
            <label key={occasion} className="flex items-center gap-3 text-samara-ivory/70 hover:text-samara-gold cursor-pointer transition-colors group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded-none border-samara-ivory/30 bg-transparent text-samara-gold focus:ring-0 focus:ring-offset-0"
                checked={selectedOccasions.includes(occasion)}
                onChange={() => toggleValue(occasion, selectedOccasions, setSelectedOccasions)}
              />
              <span className="text-xs font-sans tracking-wide">{occasion}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-samara-void min-h-screen text-samara-ivory pb-24 md:pb-32 pt-32">
      {/* HERO SECTION */}
      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl">
        <div className="flex flex-col items-center justify-center mb-16 text-center">
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
            Signature Selection
          </span>
          <h1 className="text-4xl md:text-5xl font-serif text-samara-ivory mb-6">
            Timeless <em className="italic text-samara-gold">Sarees</em>
          </h1>
          <p className="text-sm font-sans tracking-wide text-samara-ivory/60 max-w-md mx-auto">
             Six yards of sheer elegance, woven with stories of our heritage.
          </p>
        </div>

        {/* LISTING + FILTERS */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          {/* ------------------- SIDEBAR FILTERS (DESKTOP) ------------------- */}
          <aside className="hidden lg:block lg:w-64 shrink-0">
            <div className="sticky top-32">
              {FilterContent}
            </div>
          </aside>

          {/* ------------------- PRODUCT GRID ------------------- */}
          <div className="flex-1">
            
            {/* MOBILE FILTER BAR & COUNT */}
            <div className="lg:hidden flex gap-4 mb-8">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 h-12 border border-samara-ivory/20 text-samara-ivory/80 text-[11px] font-sans tracking-[0.15em] uppercase hover:border-samara-gold hover:text-samara-gold transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>

              <button
                onClick={() => setMobileSortOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 h-12 border border-samara-ivory/20 text-samara-ivory/80 text-[11px] font-sans tracking-[0.15em] uppercase hover:border-samara-gold hover:text-samara-gold transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
                Sort
              </button>
            </div>

            {/* Desktop Sort Header */}
            <div className="hidden lg:flex justify-between items-center mb-10 pb-4 border-b border-samara-ivory/10">
              <p className="text-[11px] font-sans tracking-[0.15em] uppercase text-samara-ivory/60">
                Showing <span className="text-samara-gold">{filteredProducts.length}</span> pieces
              </p>
              
              <div className="flex items-center gap-4">
                 <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-gold">Sort By</span>
                 <div className="relative group">
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="appearance-none bg-transparent border-0 border-b border-samara-ivory/20 text-samara-ivory text-[11px] font-sans tracking-widest uppercase pr-8 py-1 focus:ring-0 focus:border-samara-gold cursor-pointer"
                    >
                      <option value="relevance" className="bg-samara-void1">Relevance</option>
                      <option value="price_low_high" className="bg-samara-void1">Price: Low to High</option>
                      <option value="price_high_low" className="bg-samara-void1">Price: High to Low</option>
                      <option value="newest" className="bg-samara-void1">Newest First</option>
                    </select>
                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-samara-ivory/40 pointer-events-none group-hover:text-samara-gold transition-colors" />
                 </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                 {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-[3/4] bg-samara-void1 animate-pulse" />
                 ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-24 bg-samara-void1/50 border border-samara-ivory/10">
                <p className="text-sm font-sans tracking-widest text-samara-ivory/40 uppercase mb-4">No pieces found</p>
                <button
                  onClick={() => {
                     setPriceRangeApplied([priceMinDisplayed, priceMaxDisplayed]);
                     setSelectedFabrics([]);
                     setSelectedColors([]);
                     setSelectedOccasions([]);
                  }}
                  className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-gold border-b border-samara-gold pb-1"
                >
                   Clear Filters
                </button>
              </div>
            ) : (
              <div
                id="products-grid"
                className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8"
              >
                {filteredProducts.map((product) => {
                   const resolved = priceMap[product.id];
                   // Pass matching ProductImage type
                   const mainImage = product.images?.find(img => img.is_primary) 
                                     || product.images?.[0];
                   return (
                      <ProductCard 
                         key={product.id}
                         product={product}
                         image={mainImage}
                         price={resolved}
                      />
                   );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE FILTER BOTTOM SHEET */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden flex justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-samara-void/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileFiltersOpen(false)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-samara-void1 border-t border-samara-gold/20 flex flex-col shadow-2xl transition-transform duration-300 translate-y-0">
            
            {/* Header */}
            <div className="p-6 border-b border-samara-ivory/10 flex items-center justify-between sticky top-0 bg-samara-void1 z-10">
              <h3 className="font-serif text-2xl text-samara-gold">Filters</h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-samara-ivory/60 hover:text-samara-gold transition-colors"
              >
                <X className="w-6 h-6 stroke-[1.5]" />
              </button>
            </div>

            {/* Filter Content (Scrollable) */}
            <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 space-y-6">
              {FilterContent}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE SORT BOTTOM SHEET */}
      {mobileSortOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="absolute inset-0 bg-samara-void/80 backdrop-blur-sm"
            onClick={() => setMobileSortOpen(false)}
          />

          <div className="absolute bottom-0 left-0 right-0 bg-samara-void1 border-t border-samara-gold/20">
            <div className="p-6 border-b border-samara-ivory/10 flex items-center justify-between">
              <h3 className="font-serif text-2xl text-samara-gold">Sort By</h3>
              <button onClick={() => setMobileSortOpen(false)} className="text-samara-ivory/60 hover:text-samara-gold">
                 <X className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>

            <div className="flex flex-col">
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
                   className={`w-full px-6 py-5 text-left border-b border-samara-ivory/5 text-[11px] font-sans tracking-widest uppercase transition-colors
                     ${sortBy === value
                       ? 'text-samara-gold'
                       : 'text-samara-ivory/70 hover:text-samara-ivory'}`}
                 >
                   {label}
                 </button>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}