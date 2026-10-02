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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 max-w-7xl mx-auto">
      {products.map((product) => {
        const price = priceMap[product.id];

        return (
          <Link key={product.id} href={`/products/${product.slug}`}>
            <div className="group relative overflow-hidden">

              {/* IMAGE */}
              <div className="aspect-[3/4] relative overflow-hidden bg-samara-void1">
                {product.primary_image_url ? (
                  <img
                    src={product.primary_image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-samara-void1">
                    <span className="text-samara-ivory/20 font-serif text-sm">
                      No Image
                    </span>
                  </div>
                )}

                {/* BADGES */}
                {showBestseller && product.is_bestseller && (
                  <div className="absolute top-3 left-3 bg-samara-gold text-samara-void px-3 py-1 text-[10px] font-sans tracking-[0.1em] uppercase flex items-center gap-1.5">
                    <Star className="h-3 w-3 fill-current" />
                    Bestseller
                  </div>
                )}

                {showNew && product.is_new_arrival && (
                  <div className="absolute top-3 left-3 bg-samara-ivory text-samara-void px-3 py-1 text-[10px] font-sans tracking-[0.1em] uppercase flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    New
                  </div>
                )}

                {/* Wishlist button */}
                <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-samara-void/50 backdrop-blur-sm border border-samara-ivory/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-samara-gold hover:border-samara-gold hover:text-samara-void">
                  <Heart className="h-4 w-4 text-samara-ivory stroke-[1.5]" />
                </button>

                {/* Quick View overlay on hover */}
                <div className="absolute inset-x-0 bottom-0 h-12 flex items-center justify-center bg-samara-void/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-full group-hover:translate-y-0">
                  <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory">Quick View</span>
                </div>
              </div>

              {/* PRODUCT INFO */}
              <div className="pt-4 pb-2">
                <h3 className="font-serif text-base md:text-lg text-samara-ivory group-hover:text-samara-gold transition-colors duration-300 line-clamp-1 mb-2">
                  {product.name}
                </h3>

                {!price ? (
                  <div className="h-5 w-24 bg-samara-void1 animate-pulse" />
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-sm md:text-base font-sans tracking-wide text-samara-gold">
                      {formatPriceSync(price.displayPrice, price.currency)}
                    </p>

                    {price.mrp && (
                      <p className="text-xs text-samara-ivory/40 line-through">
                        {formatPriceSync(price.mrp, price.currency)}
                      </p>
                    )}

                    {price.discountPct && (
                      <span className="text-[10px] font-sans tracking-wider text-green-400 bg-green-400/10 px-2 py-0.5">
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