'use client';

import { useCart } from '@/lib/cart-context';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSareeProducts, type ProductWithImages } from '@/lib/content';
import { Star, Sparkles, ChevronDown } from 'lucide-react';

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
// ✅ FIXED: Use the client-side region hook for consistency
import { getUserRegion } from '@/lib/region/client';

export default function SareesPage() {
  // ------------------------------------------------------------------
  // STATE MANAGEMENT
  // ------------------------------------------------------------------
  
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
  const { currency } = useCart();
  const region = getUserRegion();
  const [rates, setRates] = useState<any>(null);

  // Price Map: Stores the calculated pricing for every product
  const [priceMap, setPriceMap] = useState<
    Record<
      string,
      {
        price: number;       // Selling Price (e.g. $150)
        currency: SupportedCurrency;   // Currency Code
        mrp: number | null;  // Calculated MRP (e.g. $283)
        discountPct: number; // Percentage (e.g. 47)
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
  // 3. RESOLVE PRICES (SINGLE SOURCE OF TRUTH)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!allProducts.length) return;

    const loadPrices = async () => {
      const map: Record<string, any> = {};

      for (const product of allProducts) {
        // The resolver handles all logic: database lookup, currency conversion, 
        // and region-specific MRP calculations.
        const resolved = await resolveFinalPrice(product, region, currency);

        if (resolved && resolved.displayPrice > 0) {
          // ✅ CORRECTED: Direct Mapping. No manual math.
          map[product.id] = {
            price: resolved.displayPrice,
            currency: resolved.currency as SupportedCurrency,
            mrp: resolved.mrp,           // Resolver provides correct MRP
            discountPct: resolved.discountPct ?? 0, // Resolver provides correct %
          };
        }
      }

      setPriceMap(map);
    };

    loadPrices();
  }, [allProducts, region, currency]); 

  // ------------------------------------------------------------------
  // 4. INITIALIZE SLIDER BOUNDS
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!allProducts.length) return;
    if (Object.keys(priceMap).length === 0) return;
    
    // Get min/max from the currently displayed prices
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
    
  }, [allProducts, priceMap, currency]); 

  // ------------------------------------------------------------------
  // 5. MEMOIZE FILTER OPTIONS (Strict Types)
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
  // 6. APPLY FILTERS
  // ------------------------------------------------------------------
  useEffect(() => {
    if (Object.keys(priceMap).length === 0 && allProducts.length > 0) return;

    let current = [...allProducts];

    // Attribute Filters
    if (selectedFabrics.length > 0) {
      current = current.filter((p) => p.fabric && selectedFabrics.includes(p.fabric.trim()));
    }
    if (selectedColors.length > 0) {
      current = current.filter((p) => p.color && selectedColors.includes(p.color.trim()));
    }
    if (selectedOccasions.length > 0) {
      current = current.filter((p) => p.occasion && selectedOccasions.includes(p.occasion.trim()));
    }

    // Price Filter
    if (priceReady) {
      const [minSelected, maxSelected] = priceRangeApplied;
      current = current.filter((p) => {
        const productPrice = priceMap[p.id]?.price ?? 0;
        return productPrice >= minSelected && productPrice <= maxSelected;
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
    priceMap
  ]);

  const toggleValue = (value: string, list: string[], setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  // Slider CSS Helper
  const getPercent = (value: number) => {
    const min = priceMinDisplayed;
    const max = priceMaxDisplayed;
    if (max === min) return 0;
    return Math.round(((value - min) / (max - min)) * 100);
  };

  const minPercent = getPercent(priceRangeDraft[0]);
  const maxPercent = getPercent(priceRangeDraft[1]);

  return (
    <div className="bg-black text-white min-h-screen">
      <style jsx global>{`
        .range-slider-thumb {
          pointer-events: none;
        }
        .range-slider-thumb::-webkit-slider-thumb {
          pointer-events: auto;
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #D4AF37;
          cursor: pointer;
          margin-top: -6px;
          position: relative;
          z-index: 50;
        }
        .range-slider-thumb::-moz-range-thumb {
          pointer-events: auto;
          height: 16px;
          width: 16px;
          border: none;
          border-radius: 50%;
          background: #D4AF37;
          cursor: pointer;
          z-index: 50;
        }
      `}</style>

      {/* HERO SECTION */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-black to-[#0b0b0b] border-b border-[#D4AF37]/10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] tracking-tighter">
              Sarees
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Explore our curated saree collection
            </p>
          </div>
        </div>
      </section>

      {/* LISTING + FILTERS */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* ------------------- SIDEBAR FILTERS ------------------- */}
            <aside className="lg:w-72 flex-shrink-0">
              <div className="space-y-4 sticky top-24">
                
                {/* Price Filter */}
                <div className="bg-[#0b0b0b] border-2 border-[#D4AF37]/20 rounded-lg p-6 hover:border-[#D4AF37]/40 transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif text-lg font-semibold text-[#D4AF37]">Price</span>
                    <ChevronDown className="h-5 w-5 text-[#D4AF37]" />
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center text-sm text-gray-300">
                      <div>Min: <span className="font-semibold text-[#D4AF37]">{formatPriceSync(priceRangeDraft[0], currency)}</span></div>
                      <div>Max: <span className="font-semibold text-[#D4AF37]">{formatPriceSync(priceRangeDraft[1], currency)}</span></div>
                    </div>

                    <div className="relative h-6 w-full">
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-700 rounded-full -translate-y-1/2 z-0"></div>
                      <div 
                        className="absolute top-1/2 h-1 bg-[#D4AF37] rounded-full -translate-y-1/2 z-10"
                        style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
                      ></div>

                      <input
                        type="range"
                        min={priceMinDisplayed}
                        max={priceMaxDisplayed}
                        value={priceRangeDraft[0]}
                        onChange={(e) => {
                          const val = Math.min(Number(e.target.value), priceRangeDraft[1] - 1);
                          setPriceRangeDraft([val, priceRangeDraft[1]]);
                        }}
                        className="range-slider-thumb absolute top-0 left-0 w-full h-full appearance-none bg-transparent z-20 m-0 p-0"
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
                        className="range-slider-thumb absolute top-0 left-0 w-full h-full appearance-none bg-transparent z-30 m-0 p-0"
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
            </aside>

            {/* ------------------- PRODUCT GRID ------------------- */}
            <div className="flex-1">
              <div className="mb-8">
                <p className="text-gray-400 text-lg">
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
                <div id="products-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <Link key={product.id} href={`/products/${product.slug}`}>
                      <div className="group relative bg-black rounded-lg overflow-hidden border-2 border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/40 transition-all duration-500 hover:-translate-y-2">
                        {/* Image Container */}
                        <div className="aspect-[3/4] relative overflow-hidden bg-[#111111]">
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

                        {/* Product Info */}
                        <div className="p-4 bg-gradient-to-b from-black to-[#0b0b0b]">
                          <h3 className="font-serif text-base md:text-lg font-semibold mb-1 line-clamp-1 text-[#D4AF37] group-hover:text-[#F4D03F] transition-colors">
                            {product.name}
                          </h3>
                          {product.brand && <p className="text-xs text-gray-500 mb-2">{product.brand}</p>}
                          
                          {/* ✅ PRICE DISPLAY (READ ONLY FROM MAP) */}
                          {(() => {
                            const resolved = priceMap[product.id];
                            if (!resolved) return <div className="h-6 w-24 bg-gray-800 animate-pulse rounded" />;

                            return (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Selling Price */}
                                  <p className="text-lg md:text-xl font-bold text-[#D4AF37]">
                                    {formatPriceSync(resolved.price, resolved.currency)}
                                  </p>

                                  {/* MRP (Calculated) */}
                                  {resolved.mrp && resolved.mrp > resolved.price && (
                                    <p className="text-xs md:text-sm text-gray-500 line-through">
                                      {formatPriceSync(resolved.mrp, resolved.currency)}
                                    </p>
                                  )}

                                  {/* Discount Badge */}
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
    </div>
  );
}