'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSareeProducts, type ProductWithImages } from '@/lib/content';
import { Star, Sparkles, Heart, ChevronDown } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/currency';

export default function SareesPage() {
  const [allProducts, setAllProducts] = useState<ProductWithImages[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);

  // price slider state (values are in selected currency units)
  const [priceMinDisplayed, setPriceMinDisplayed] = useState<number>(0);
  const [priceMaxDisplayed, setPriceMaxDisplayed] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]); // [min, max] in displayed currency

  // currency/rate from cart/context
  const { currency, rate } = useCart();

  // 1) Load all saree products on mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const products = await getSareeProducts(); // uses show_in_sarees = true in your lib
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

  // compute numeric min/max (INR) from products
  const minPriceInr = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return 0;
    return Math.min(...allProducts.map((p) => p.base_price_inr || 0));
  }, [allProducts]);

  const maxPriceInr = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return 0;
    return Math.max(...allProducts.map((p) => p.base_price_inr || 0));
  }, [allProducts]);

  // whenever currency or products change, initialize the displayed slider bounds
  useEffect(() => {
    // rate is INR per 1 unit of selected currency (e.g. 83.5 INR per 1 USD)
    // displayed currency amount = INR / rate
    const displayedMin = Math.floor((minPriceInr / (rate || 1)));
    const displayedMax = Math.ceil((maxPriceInr / (rate || 1)));

    // put sensible defaults: min = 0 or displayedMin, max = displayedMax
    const initialMin = 0; // let slider start at 0
    const initialMax = displayedMax || 0;

    setPriceMinDisplayed(initialMin);
    setPriceMaxDisplayed(initialMax);

    // set current range to full span by default
    setPriceRange([initialMin, initialMax]);
  }, [minPriceInr, maxPriceInr, rate, currency]);

  // 2) Collect unique filter options from products
  const fabricOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allProducts
            .map((p) => p.fabric?.trim())
            .filter((f): f is string => !!f)
        )
      ).sort(),
    [allProducts]
  );

  const colorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allProducts
            .map((p) => p.color?.trim())
            .filter((c): c is string => !!c)
        )
      ).sort(),
    [allProducts]
  );

  const occasionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allProducts
            .map((p) => p.occasion?.trim())
            .filter((o): o is string => !!o)
        )
      ).sort(),
    [allProducts]
  );

  // 3) Apply filters whenever selections or priceRange change
  useEffect(() => {
    let current = [...allProducts];

    if (selectedFabrics.length > 0) {
      current = current.filter((p) =>
        p.fabric ? selectedFabrics.includes(p.fabric.trim()) : false
      );
    }

    if (selectedColors.length > 0) {
      current = current.filter((p) =>
        p.color ? selectedColors.includes(p.color.trim()) : false
      );
    }

    if (selectedOccasions.length > 0) {
      current = current.filter((p) =>
        p.occasion ? selectedOccasions.includes(p.occasion.trim()) : false
      );
    }

    // priceRange is in displayed currency, convert to INR for comparison:
    // INR value = displayedCurrency * rate
    const [minDisplayed, maxDisplayed] = priceRange;
    const minInr = Math.max(0, Math.floor(minDisplayed * (rate || 1)));
    const maxInr = Math.ceil(maxDisplayed * (rate || 1));

    current = current.filter((p) => {
      const price = p.base_price_inr || 0;
      return price >= minInr && price <= maxInr;
    });

    setFilteredProducts(current);
  }, [allProducts, selectedFabrics, selectedColors, selectedOccasions, priceRange, rate]);

  // 4) Helpers for toggling checkboxes
  const toggleValue = (
    value: string,
    list: string[],
    setter: (next: string[]) => void
  ) => {
    if (list.includes(value)) {
      setter(list.filter((v) => v !== value));
    } else {
      setter([...list, value]);
    }
  };

  // slider handlers (two-handle approach using two range inputs)
  const handleMinSliderChange = (val: number) => {
    let newMin = Math.min(val, priceRange[1]); // don't let min exceed max
    setPriceRange([newMin, priceRange[1]]);
  };

  const handleMaxSliderChange = (val: number) => {
    let newMax = Math.max(val, priceRange[0]); // don't let max go below min
    setPriceRange([priceRange[0], newMax]);
  };

  // small helper to format displayed currency values
  const formatDisplayed = (valueInDisplayedCurrency: number) => {
    // valueInDisplayedCurrency is amount in selected currency
    // we can use formatPrice by converting back to INR: INR = value * rate
    const inr = Math.round(valueInDisplayedCurrency * (rate || 1));
    return formatPrice(inr, currency, rate);
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* HERO */}
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
            {/* SIDEBAR FILTERS */}
            <aside className="lg:w-72 flex-shrink-0">
              <div className="space-y-4 sticky top-24">
                {/* Price Filter */}
                <div className="bg-[#0b0b0b] border-2 border-[#D4AF37]/20 rounded-lg p-6 hover:border-[#D4AF37]/40 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-lg font-semibold text-[#D4AF37]">
                      Price
                    </span>
                    <ChevronDown className="h-5 w-5 text-[#D4AF37]" />
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between items-center text-sm text-gray-300">
                      <div>Min: <span className="font-semibold">{formatDisplayed(priceRange[0])}</span></div>
                      <div>Max: <span className="font-semibold">{formatDisplayed(priceRange[1])}</span></div>
                    </div>

                    {/* Two-handle slider via two inputs */}
                    <div className="space-y-2">
                      <input
                        aria-label="Minimum price"
                        type="range"
                        min={priceMinDisplayed}
                        max={priceMaxDisplayed}
                        value={priceRange[0]}
                        onChange={(e) => handleMinSliderChange(Number(e.target.value))}
                        className="w-full accent-[#D4AF37]"
                      />
                      <input
                        aria-label="Maximum price"
                        type="range"
                        min={priceMinDisplayed}
                        max={priceMaxDisplayed}
                        value={priceRange[1]}
                        onChange={(e) => handleMaxSliderChange(Number(e.target.value))}
                        className="w-full accent-[#D4AF37]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="flex-1 px-3 py-2 rounded bg-[#111] border border-[#D4AF37]/20 text-sm"
                        onClick={() => setPriceRange([priceMinDisplayed, priceMaxDisplayed])}
                      >
                        Reset
                      </button>
                      <button
                        className="flex-1 px-3 py-2 rounded bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black font-semibold text-sm"
                        onClick={() => {
                          // already applied live — button can scroll to results or just be noop
                          const el = document.querySelector('#products-grid');
                          if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fabric filter */}
                <div className="bg-[#0b0b0b] border-2 border-[#D4AF37]/20 rounded-lg p-6 hover:border-[#D4AF37]/40 transition-all duration-300">
                  <button className="w-full flex items-center justify-between text-left">
                    <span className="font-serif text-lg font-semibold text-[#D4AF37]">
                      Fabric
                    </span>
                    <ChevronDown className="h-5 w-5 text-[#D4AF37]" />
                  </button>
                  <div className="mt-4 space-y-2">
                    {fabricOptions.length === 0 ? (
                      <p className="text-xs text-gray-500">No fabric options yet</p>
                    ) : (
                      fabricOptions.map((fabric) => (
                        <label
                          key={fabric}
                          className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-[#D4AF37]/30"
                            checked={selectedFabrics.includes(fabric)}
                            onChange={() =>
                              toggleValue(fabric, selectedFabrics, setSelectedFabrics)
                            }
                          />
                          <span className="text-sm">{fabric}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Color filter */}
                <div className="bg-[#0b0b0b] border-2 border-[#D4AF37]/20 rounded-lg p-6 hover:border-[#D4AF37]/40 transition-all duration-300">
                  <button className="w-full flex items-center justify-between text-left">
                    <span className="font-serif text-lg font-semibold text-[#D4AF37]">
                      Color
                    </span>
                    <ChevronDown className="h-5 w-5 text-[#D4AF37]" />
                  </button>
                  <div className="mt-4 space-y-2">
                    {colorOptions.length === 0 ? (
                      <p className="text-xs text-gray-500">No color options yet</p>
                    ) : (
                      colorOptions.map((color) => (
                        <label
                          key={color}
                          className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-[#D4AF37]/30"
                            checked={selectedColors.includes(color)}
                            onChange={() =>
                              toggleValue(color, selectedColors, setSelectedColors)
                            }
                          />
                          <span className="text-sm">{color}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Occasion filter */}
                <div className="bg-[#0b0b0b] border-2 border-[#D4AF37]/20 rounded-lg p-6 hover:border-[#D4AF37]/40 transition-all duration-300">
                  <button className="w-full flex items-center justify-between text-left">
                    <span className="font-serif text-lg font-semibold text-[#D4AF37]">
                      Occasion
                    </span>
                    <ChevronDown className="h-5 w-5 text-[#D4AF37]" />
                  </button>
                  <div className="mt-4 space-y-2">
                    {occasionOptions.length === 0 ? (
                      <p className="text-xs text-gray-500">No occasion options yet</p>
                    ) : (
                      occasionOptions.map((occasion) => (
                        <label
                          key={occasion}
                          className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-[#D4AF37]/30"
                            checked={selectedOccasions.includes(occasion)}
                            onChange={() =>
                              toggleValue(
                                occasion,
                                selectedOccasions,
                                setSelectedOccasions
                              )
                            }
                          />
                          <span className="text-sm">{occasion}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </aside>

            {/* PRODUCT GRID */}
            <div className="flex-1">
              <div className="mb-8">
                <p className="text-gray-400 text-lg">
                  <span className="text-[#D4AF37] font-semibold">
                    {filteredProducts.length}
                  </span>{' '}
                  products
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
                        <div className="aspect-[3/4] relative overflow-hidden bg-[#111111]">
                          {product.primary_image_url ? (
                            <img
                              src={product.primary_image_url}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#111111] to-[#0b0b0b]">
                              <span className="text-gray-700 font-serif text-sm">Product Image</span>
                            </div>
                          )}
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

                          <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
                            <Heart className="h-4 w-4 text-[#D4AF37]" />
                          </button>
                        </div>
                        <div className="p-4 bg-gradient-to-b from-black to-[#0b0b0b]">
                          <h3 className="font-serif text-base md:text-lg font-semibold mb-1 line-clamp-1 text-[#D4AF37] group-hover:text-[#F4D03F] transition-colors">
                            {product.name}
                          </h3>
                          {product.brand && (
                            <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <p className="text-lg md:text-xl font-bold text-[#D4AF37]">
                              {formatPrice(product.base_price_inr, currency, rate)}
                            </p>
                            <p className="text-sm text-gray-600 line-through">
                              {formatPrice(Math.round(product.base_price_inr * 1.3), currency, rate)}
                            </p>
                          </div>
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
