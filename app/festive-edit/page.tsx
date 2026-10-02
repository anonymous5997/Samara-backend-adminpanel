'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFestiveEditProducts, type ProductWithImages } from '@/lib/content';
import { formatPriceSync, type SupportedCurrency } from '@/lib/currency-utils';
import { getCurrencyRates } from '@/lib/currency-utils';
import { ProductCard } from '@/components/product-card';

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
  const [priceMap, setPriceMap] = useState<Record<string, import('@/lib/resolve-product-price').ResolvedPrice>>({});

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
            resolved,
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
          (item): item is [string, import('@/lib/resolve-product-price').ResolvedPrice] => item !== null
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
    <div className="bg-samara-void text-samara-ivory min-h-screen pt-32 pb-24 md:pb-32">
      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl">
        
        {/* HEADER */}
        <div className="text-center mb-16 md:mb-24 max-w-3xl mx-auto">
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
            The Celebration Collection
          </span>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-6">
            Festive <em className="italic text-samara-gold">Edit</em>
          </h1>
          <p className="text-sm md:text-base font-sans text-samara-ivory/60 leading-relaxed">
            Celebrate in style with our curated collection of festive sarees,
            designed to make every occasion unforgettable.
          </p>
        </div>

        {/* LOADING & EMPTY STATES */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-[3/4] bg-samara-void1 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 border border-samara-ivory/10 bg-samara-void1/50">
            <p className="text-sm font-sans tracking-widest text-samara-ivory/40 uppercase mb-6">
              Our festive collection is being curated. Check back soon!
            </p>
            <Link
              href="/sarees"
              className="inline-block px-8 py-4 bg-samara-gold hover:bg-samara-goldDeep text-samara-void font-sans tracking-[0.2em] uppercase text-[11px] transition-colors"
            >
              Browse All Sarees
            </Link>
          </div>
        ) : (
          
          /* PRODUCT GRID */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {products.map((product) => {
              const priceData = priceMap[product.id];
              const mainImage = product.images?.find(img => img.is_primary) 
                                     || product.images?.[0];

              return (
                <ProductCard
                   key={product.id}
                   product={product}
                   image={mainImage}
                   price={priceData}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}