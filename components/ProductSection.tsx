'use client';

import Link from 'next/link';
import { Heart, Star, Sparkles } from 'lucide-react';
import { ProductWithImages } from '@/lib/content';
import { useCart } from '@/lib/cart-context';
import { useEffect, useState } from 'react';

import { resolveFinalPrice, ResolvedPrice } from '@/lib/resolve-product-price';
import { formatPriceSync } from '@/lib/currency-utils';
import { getUserRegion } from '@/lib/region/client';
// ✅ STEP 3: Import rate loader
import { getCurrencyRates } from '@/lib/currency/get-currency-rates';

interface ProductSectionProps {
  products: ProductWithImages[];
  showBestseller?: boolean;
  showNew?: boolean;
}

export function ProductSection({
  products,
  showBestseller = false,
  showNew = false,
}: ProductSectionProps) {
  const { currency } = useCart();
  const region = getUserRegion();

  const [priceMap, setPriceMap] = useState<Record<string, ResolvedPrice>>({});
  
  // ✅ STEP 4: State for rates
  const [rates, setRates] = useState<Record<string, number> | null>(null);

  /* -----------------------------------------------------
     LOAD RATES ONCE
  ----------------------------------------------------- */
  useEffect(() => {
    getCurrencyRates()
      .then(setRates)
      .catch((err) => console.error("Failed to load currency rates:", err));
  }, []);

  /* -----------------------------------------------------
     LOAD PRICES — SINGLE SOURCE OF TRUTH
  ----------------------------------------------------- */
  useEffect(() => {
    if (!products.length) return;
    
    // ✅ STEP 5: Guard - Do not resolve prices until rates are ready
    if (!rates) return;

    const loadPrices = async () => {
      const map: Record<string, ResolvedPrice> = {};

      for (const product of products) {
        // ✅ STEP 6: Pass 'rates' to resolveFinalPrice
        map[product.id] = await resolveFinalPrice(product, region, currency, rates);
      }

      setPriceMap(map);
    };

    loadPrices();
  }, [products, region, currency, rates]); // Added 'rates' dependency

  return (
    // ✅ STEP 1: Fix grid columns (2 cols mobile, 3 cols tablet, 4 cols desktop)
    // Removed 'grid-cols-1 sm:grid-cols-2', added 'grid-cols-2 md:grid-cols-3'
    // Reduced gap on mobile (gap-3) vs desktop (gap-6)
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 max-w-7xl mx-auto">
      {products.map((product) => {
        const price = priceMap[product.id];

        return (
          <Link key={product.id} href={`/products/${product.slug}`}>
            {/* ✅ STEP 8: Prevent hover lift on mobile (md:hover:-translate-y-2) */}
            <div className="group relative bg-gradient-to-br from-[#0d0d0d] to-[#000000] rounded-lg md:rounded-2xl overflow-hidden border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/50 transition-all duration-500 md:hover:-translate-y-2">

              {/* IMAGE */}
              {/* ✅ STEP 2: Reduce image height on mobile (aspect-[2/3] -> md:aspect-[3/4]) */}
              <div className="aspect-[2/3] md:aspect-[3/4] relative overflow-hidden bg-[#111111]">
                {product.primary_image_url ? (
                  <img
                    src={product.primary_image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-700 font-serif text-sm">
                      Product Image
                    </span>
                  </div>
                )}

                {/* BADGES */}
                {/* ✅ STEP 6: Reduce badge size & adjust position (top-2 left-2, text-[10px]) */}
                {showBestseller && product.is_bestseller && (
                  <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-2 py-0.5 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 shadow-lg">
                    <Star className="h-3 w-3 fill-current" />
                    Bestseller
                  </div>
                )}

                {showNew && product.is_new_arrival && (
                  <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-2 py-0.5 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 shadow-lg">
                    <Sparkles className="h-3 w-3 fill-current" />
                    New
                  </div>
                )}

                {/* ✅ STEP 7: Reduce heart icon size on mobile (w-7 h-7, top-2 right-2) */}
                <button className="absolute top-2 right-2 md:top-3 md:right-3 w-7 h-7 md:w-9 md:h-9 rounded-full bg-black/60 border border-[#D4AF37]/30 flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition-colors">
                  <Heart className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#D4AF37] group-hover:text-current" />
                </button>
              </div>

              {/* INFO */}
              {/* ✅ STEP 3: Reduce card padding on mobile (p-2 -> md:p-4) */}
              <div className="p-2 md:p-4">
                {/* ✅ STEP 4: Reduce product title size on mobile (text-sm -> md:text-lg) */}
                <h3 className="font-serif text-sm md:text-lg font-semibold mb-1 leading-tight text-white line-clamp-1">
                  {product.name}
                </h3>

                {!price ? (
                  <div className="h-5 w-24 bg-gray-800 animate-pulse rounded" />
                ) : (
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 flex-wrap">
                    {/* ✅ STEP 5: Reduce price size on mobile (text-base -> md:text-xl) */}
                    <div className="flex items-center gap-2">
                        <p className="text-base md:text-xl font-bold text-[#D4AF37]">
                        {formatPriceSync(price.displayPrice, price.currency)}
                        </p>

                        {price.mrp && (
                        <p className="text-[10px] md:text-sm text-gray-600 line-through">
                            {formatPriceSync(price.mrp, price.currency)}
                        </p>
                        )}
                    </div>

                    {price.discountPct && (
                      <span className="text-[10px] md:text-xs font-bold text-green-400 md:ml-auto bg-green-900/20 px-1.5 py-0.5 rounded w-fit">
                        {price.discountPct}% OFF
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
  );
}