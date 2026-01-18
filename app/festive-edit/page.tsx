'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFestiveEditProducts, type ProductWithImages } from '@/lib/content';
import { Star, Sparkles } from 'lucide-react';
import { formatPriceSync, type SupportedCurrency } from '@/lib/currency-utils';
// ✅ STEP 1: Import currency rates fetcher
import { getCurrencyRates } from '@/lib/currency-utils';

/* -----------------------------------------------------
   ✅ PRICING UTILITIES & REGION FIX
----------------------------------------------------- */
import { resolveFinalPrice } from '@/lib/resolve-product-price';
// ✅ FIXED: Using the client-side region detector
import { getUserRegion } from '@/lib/region/client';

export default function FestiveEditPage() {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------
  // 1. REGION & RATES
  // ---------------------------------------------------------
  const region = getUserRegion();
  // ✅ STEP 2: Add rates state
  const [rates, setRates] = useState<Record<string, number> | null>(null);

  // ---------------------------------------------------------
  // 2. PRICE STATE (Simplified for Display)
  // ---------------------------------------------------------
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

  /* -----------------------------------------------------
     3. LOAD RATES (✅ STEP 3: Fetch once on mount)
  ----------------------------------------------------- */
  useEffect(() => {
    const loadRates = async () => {
      const r = await getCurrencyRates();
      setRates(r);
    };

    loadRates();
  }, []);

  /* -----------------------------------------------------
     4. LOAD PRODUCTS
  ----------------------------------------------------- */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await getFestiveEditProducts();
        setProducts(data);
      } catch (error) {
        console.error('Error loading festive products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  /* -----------------------------------------------------
     5. RESOLVE PRICES (✅ STEP 4 & 5: Pass rates)
  ----------------------------------------------------- */
  useEffect(() => {
    // ✅ Guard: Don't resolve until we have products AND rates
    if (!products.length || !rates) return;

    const loadPrices = async () => {
      // ✅ Parallel Processing: Map all promises first
      const promises = products.map(async (product) => {
        try {
          // ✅ FIX: Pass `rates` as the 4th argument
          const resolved = await resolveFinalPrice(
            product,
            region,
            undefined,
            rates
          );

          if (!resolved || resolved.displayPrice <= 0) return null;

          return [
            product.id,
            {
              price: resolved.displayPrice,
              currency: resolved.currency as SupportedCurrency,
              mrp: resolved.mrp,
              discountPct: resolved.discountPct ?? 0,
            },
          ] as const;
        } catch (error) {
          console.error(`Failed to resolve price for ${product.id}`, error);
          return null;
        }
      });

      // ✅ Wait for all
      const results = await Promise.all(promises);

      // ✅ Convert to map
      const map = Object.fromEntries(
        results.filter(
          (item): item is [
            string,
            {
              price: number;
              currency: SupportedCurrency;
              mrp: number | null;
              discountPct: number;
            }
          ] => item !== null
        )
      );

      setPriceMap(map);
    };

    loadPrices();
  }, [products, region, rates]); // ✅ Added rates dependency

  /* -----------------------------------------------------
     RENDER
  ----------------------------------------------------- */
  return (
    <div className="bg-black text-white min-h-screen">
      <section className="relative py-24 bg-gradient-to-b from-black via-luxury-charcoal to-black">
        <div className="container mx-auto px-4 md:px-8">
          
          {/* HEADER */}
          <div className="text-center mb-16">
            <h1 className="font-serif text-6xl md:text-7xl font-bold mb-6 text-gold tracking-tighter">
              Festive Edit
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Celebrate in style with our curated collection of festive sarees,
              designed to make every occasion unforgettable.
            </p>
          </div>

          {/* LOADING & EMPTY STATES */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-gray-500">Loading festive collection...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-8">
                Our festive collection is being curated. Check back soon!
              </p>
              <Link
                href="/sarees"
                className="inline-block px-8 py-3 bg-gold-gradient text-black font-semibold rounded-lg hover:shadow-xl hover:shadow-gold/40 transition-all"
              >
                Browse All Sarees
              </Link>
            </div>
          ) : (
            
            /* PRODUCT GRID */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const priceData = priceMap[product.id];

                return (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <div className="group relative bg-black rounded-lg overflow-hidden border-2 border-gold/20 hover:border-gold hover:shadow-2xl hover:shadow-gold/30 transition-all duration-500">

                      {/* IMAGE CONTAINER */}
                      <div className="aspect-[3/4] relative overflow-hidden bg-luxury-charcoal">
                        {product.primary_image_url ? (
                          <img
                            src={product.primary_image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            Product Image
                          </div>
                        )}

                        {/* BADGES */}
                        {product.is_bestseller && (
                          <div className="absolute top-3 left-3 bg-gold text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Star className="h-3 w-3 fill-current" />
                            {product.bestseller_badge_label || 'Bestseller'}
                          </div>
                        )}

                        {product.is_new_arrival && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-gold to-gold-light text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Sparkles className="h-3 w-3" />
                            New
                          </div>
                        )}
                      </div>

                      {/* DETAILS & PRICING */}
                      <div className="p-4">
                        <h3 className="font-serif text-lg font-semibold mb-1 line-clamp-1 text-gold">
                          {product.name}
                        </h3>

                        {product.brand && (
                          <p className="text-sm text-gray-500 mb-2">
                            {product.brand}
                          </p>
                        )}

                        {!priceData ? (
                          <div className="h-5 w-24 bg-gray-800 animate-pulse rounded" />
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Display Price */}
                            <p className="text-xl font-bold text-gold">
                              {formatPriceSync(priceData.price, priceData.currency)}
                            </p>

                            {/* MRP (Only if higher) */}
                            {priceData.mrp && priceData.mrp > priceData.price && (
                              <p className="text-sm text-gray-500 line-through">
                                {formatPriceSync(priceData.mrp, priceData.currency)}
                              </p>
                            )}

                            {/* Discount Percentage */}
                            {priceData.discountPct > 0 && (
                              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded ml-auto">
                                {priceData.discountPct}% OFF
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}