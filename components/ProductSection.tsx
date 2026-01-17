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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
      {products.map((product) => {
        const price = priceMap[product.id];

        return (
          <Link key={product.id} href={`/products/${product.slug}`}>
            <div className="group relative bg-gradient-to-br from-[#0d0d0d] to-[#000000] rounded-2xl overflow-hidden border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/50 transition-all duration-500 hover:-translate-y-2">

              {/* IMAGE */}
              <div className="aspect-[3/4] relative overflow-hidden bg-[#111111]">
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
                {showBestseller && product.is_bestseller && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <Star className="h-3 w-3 fill-current" />
                    Bestseller
                  </div>
                )}

                {showNew && product.is_new_arrival && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 fill-current" />
                    New
                  </div>
                )}

                <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 border border-[#D4AF37]/30 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-[#D4AF37]" />
                </button>
              </div>

              {/* INFO */}
              <div className="p-4">
                <h3 className="font-serif text-lg font-semibold mb-1 text-white">
                  {product.name}
                </h3>

                {!price ? (
                  <div className="h-5 w-24 bg-gray-800 animate-pulse rounded" />
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xl font-bold text-[#D4AF37]">
                      {formatPriceSync(price.displayPrice, price.currency)}
                    </p>

                    {price.mrp && (
                      <p className="text-sm text-gray-600 line-through">
                        {formatPriceSync(price.mrp, price.currency)}
                      </p>
                    )}

                    {price.discountPct && (
                      <span className="text-xs font-bold text-green-400 ml-auto">
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