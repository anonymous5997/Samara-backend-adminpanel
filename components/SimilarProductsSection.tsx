'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { resolveFinalPrice, ResolvedPrice } from '@/lib/resolve-product-price';
import { formatPriceSync } from '@/lib/currency-utils';
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
  const { currency } = useCart();
  const region = getUserRegion();
  const [priceMap, setPriceMap] = useState<Record<string, ResolvedPrice>>({});

  useEffect(() => {
    if (!products.length) return;

    const load = async () => {
      const map: Record<string, ResolvedPrice> = {};
      for (const p of products) {
        map[p.id] = await resolveFinalPrice(p, region, currency);
      }
      setPriceMap(map);
    };

    load();
  }, [products, region, currency]);

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
              <div className="group border border-[#D4AF37]/30 rounded-2xl overflow-hidden">
                <div className="aspect-[3/4] bg-[#111]">
                  {product.primary_image_url && (
                    <img
                      src={product.primary_image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60">
                    <Heart className="h-4 w-4 text-[#D4AF37]" />
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="font-serif text-lg text-white">
                    {product.name}
                  </h3>

                  {price && (
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
