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
  // Note: Similar items strictly follow the user's detected Region.
  const region = getUserRegion();
  
  const [priceMap, setPriceMap] = useState<Record<string, ResolvedPrice>>({});
  
  // ✅ STEP 2: State for rates
  const [rates, setRates] = useState<Record<string, number>>({});

  /* -----------------------------------------------------
     LOAD RATES ONCE
  ----------------------------------------------------- */
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
    
    // ✅ STEP 3: Guard - Wait for rates to exist
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
      <h2 className="text-center text-3xl md:text-4xl font-serif text-[#D4AF37] mb-10 px-4">
        Similar Sarees You May Love
      </h2>

      {/* ✅ Grid Layout: Mobile 2 cols, Tablet 3 cols, Desktop 4 cols */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto px-4">
        {products.map((product) => {
          const price = priceMap[product.id];

          // ✅ 1️⃣ Discount Calculation
          const discountPercent =
            price?.mrp && price.mrp > price.displayPrice
              ? Math.round(((price.mrp - price.displayPrice) / price.mrp) * 100)
              : null;

          return (
            <Link key={product.id} href={`/products/${product.slug}`}>
              <div className="group border border-[#D4AF37]/30 rounded-2xl overflow-hidden relative bg-[#0b0b0b]">
                {/* Image Container */}
                <div className="aspect-[2/3] md:aspect-[3/4] bg-[#111] relative">
                  {product.primary_image_url && (
                    <img
                      src={product.primary_image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  
                  {/* ✅ 2️⃣ Discount Badge (Responsive) */}
                  {discountPercent && (
                    <div className="
                      absolute top-2 left-2
                      md:top-3 md:left-3
                      bg-[#D4AF37]
                      text-black
                      text-[10px] md:text-xs
                      font-bold
                      px-2 py-1
                      rounded-md
                      shadow-md
                      z-10
                    ">
                      {discountPercent}% OFF
                    </div>
                  )}

                  <button className="absolute top-3 right-3 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors z-10">
                    <Heart className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#D4AF37]" />
                  </button>
                </div>

                <div className="p-3 md:p-4">
                  <h3 className="font-serif text-sm md:text-lg text-white mb-2 truncate">
                    {product.name}
                  </h3>

                  {/* Price Skeleton or Value */}
                  {!price ? (
                    <div className="h-6 w-24 bg-gray-800 animate-pulse rounded" />
                  ) : (
                    // ✅ 3️⃣ Price Block (Fixed for Mobile)
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-base md:text-lg font-bold text-[#D4AF37]">
                        {formatPriceSync(price.displayPrice, price.currency)}
                      </p>

                      {price.mrp && (
                        <p className="text-xs md:text-sm text-gray-500 line-through">
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