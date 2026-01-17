'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { resolveFinalPrice, ResolvedPrice } from '@/lib/resolve-product-price';
// ✅ STEP 1: Import rate loader
import { formatPriceSync, getCurrencyRates } from '@/lib/currency-utils';
import { getUserRegion } from '@/lib/region/client';

interface SimilarProduct {
  id: string;
  name: string;
  slug: string;
  base_price_inr: number;
  mrp_inr?: number | null;
  primary_image_url: string | null;
}

interface Props {
  products: SimilarProduct[];
}

export function SimilarProductsSection({ products }: Props) {
  // Note: We removed useCart() currency dependency. 
  // Similar items must strictly follow the user's detected Region.
  const region = getUserRegion();
  
  const [priceMap, setPriceMap] = useState<Record<string, ResolvedPrice>>({});
  
  // ✅ STEP 2: State for rates
  const [rates, setRates] = useState<Record<string, number>>({});

  /* -----------------------------------------------------
     LOAD RATES ONCE (PREVENT CRASH)
  ----------------------------------------------------- */
  // ✅ STEP 3: Load rates immediately on mount
  useEffect(() => {
    getCurrencyRates()
      .then(setRates)
      .catch((err) => console.error("Failed to load similar product rates:", err));
  }, []);

  /* -----------------------------------------------------
     RESOLVE PRICES (STRICT REGION MODE)
  ----------------------------------------------------- */
  useEffect(() => {
    if (!products.length) return;
    
    // ✅ STEP 5: Guard - Wait for rates to exist
    if (!Object.keys(rates).length) return;

    const load = async () => {
      const map: Record<string, ResolvedPrice> = {};
      
      for (const p of products) {
        // ✅ STEP 4: Pass 'rates' and use 'undefined' for currency
        // This enforces region-based pricing (Single Source of Truth)
        map[p.id] = await resolveFinalPrice(
          p,
          region,
          undefined, // Ignore UI currency, trust Region
          rates
        );
      }
      setPriceMap(map);
    };

    load();
  }, [products, region, rates]);

  return (
    <section className="py-16 bg-black">
      <h2 className="text-center text-4xl font-serif text-[#D4AF37] mb-10">
        Similar Sarees You May Love
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {products.map((product) => {
          const price = priceMap[product.id];

          return (
            <Link key={product.id} href={`/products/${product.slug}`}>
              <div className="group border border-[#D4AF37]/30 rounded-2xl overflow-hidden relative">
                <div className="aspect-[3/4] bg-[#111] relative">
                  {product.primary_image_url && (
                    <img
                      src={product.primary_image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
                    <Heart className="h-4 w-4 text-[#D4AF37]" />
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="font-serif text-lg text-white mb-2 truncate">
                    {product.name}
                  </h3>

                  {/* Price Skeleton or Value */}
                  {!price ? (
                    <div className="h-6 w-24 bg-gray-800 animate-pulse rounded" />
                  ) : (
                    <div className="flex gap-2 items-center">
                      <p className="text-xl font-bold text-[#D4AF37]">
                        {formatPriceSync(price.displayPrice, price.currency)}
                      </p>

                      {price.mrp && (
                        <p className="text-sm text-gray-600 line-through">
                          {formatPriceSync(price.mrp, price.currency)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}