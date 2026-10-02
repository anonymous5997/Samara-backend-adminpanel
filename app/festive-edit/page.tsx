'use client';

import { useEffect, useState } from 'react';
import { getFestiveEditProducts, type ProductWithImages } from '@/lib/content';
import { type SupportedCurrency } from '@/lib/currency-utils';
import { ListingHero, PieceCount } from '@/components/listing/ListingHero';
import { ListingEmpty, ListingSkeleton } from '@/components/listing/ListingEmpty';
import { LISTING_GRID, ListingProductCard } from '@/components/listing/ListingProductCard';
import { FestiveOrnament, LozengeRule } from '@/components/listing/Ornaments';
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

  return (
    <div className="min-h-screen bg-samara-black text-samara-ivory">
      {/* HEADER */}
      <ListingHero
        eyebrow="Curated for Celebration"
        kicker={<LozengeRule />}
        title={
          <>
            Festive <span className="sm-accent">Edit</span>
          </>
        }
        intro={
          <>
            Celebrate in style with our curated collection of festive sarees,
            designed to make every occasion unforgettable.
          </>
        }
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Festive Edit' }]}
        meta={!loading && products.length > 0 ? <PieceCount count={products.length} /> : null}
        ornament={<FestiveOrnament />}
      />

      <section className="py-[clamp(3.5rem,7vw,6.5rem)]">
        <div className="sm-container">
          {/* LOADING & EMPTY STATES */}
          {loading ? (
            <div role="status">
              <span className="sr-only">Loading festive collection...</span>
              <ListingSkeleton count={4} className={LISTING_GRID} />
            </div>
          ) : products.length === 0 ? (
            <ListingEmpty
              eyebrow="Festive Edit"
              title="Our festive collection is being curated. Check back soon!"
              actions={[{ label: 'Browse All Sarees', href: '/sarees' }]}
            />
          ) : (
            /* PRODUCT GRID */
            <div className={LISTING_GRID}>
              {products.map((product, index) => {
                const priceData = priceMap[product.id];
                const badges = [
                  ...(product.is_bestseller ? [product.bestseller_badge_label || 'Bestseller'] : []),
                  ...(product.is_new_arrival ? ['New'] : []),
                ];

                return (
                  <ListingProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    badges={badges}
                    price={priceData}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
