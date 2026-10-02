'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ProductWithImages } from '@/lib/content';
import { useCart } from '@/lib/cart-context';
import { useEffect, useState } from 'react';
import { resolveFinalPrice, ResolvedPrice } from '@/lib/resolve-product-price';
import { formatPriceSync } from '@/lib/currency-utils';
import { getUserRegion } from '@/lib/region/client';
import { getCurrencyRates } from '@/lib/currency/get-currency-rates';

export function ProductRail({ products }: { products: ProductWithImages[] }) {
  const { currency } = useCart();
  const region = getUserRegion();
  const [priceMap, setPriceMap] = useState<Record<string, ResolvedPrice>>({});
  const [rates, setRates] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    getCurrencyRates().then(setRates).catch(console.error);
  }, []);

  useEffect(() => {
    if (!products.length || !rates) return;
    const loadPrices = async () => {
      const map: Record<string, ResolvedPrice> = {};
      for (const p of products) {
        map[p.id] = await resolveFinalPrice(p, region, currency, rates);
      }
      setPriceMap(map);
    };
    loadPrices();
  }, [products, region, currency, rates]);

  if (!products.length) return null;

  return (
    <section className="py-24 md:py-32 bg-samara-void border-t border-samara-gold/10 overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 lg:px-16 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between">
          <div>
            <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold block mb-4">
              Just Arrived
            </span>
            <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-samara-ivory">
              New <em className="italic font-light text-samara-gold">Arrivals</em>
            </h2>
          </div>
          <Link href="/shop" className="hidden md:flex items-center gap-3 group mt-8 md:mt-0">
            <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory border-b border-samara-ivory/30 pb-1 group-hover:border-samara-gold group-hover:text-samara-gold transition-colors">
              Explore All
            </span>
            <ArrowRight className="w-4 h-4 text-samara-ivory/50 group-hover:text-samara-gold group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Horizontal Scroll Rail */}
      <div className="w-full pl-6 md:pl-12 lg:pl-16 pb-8 overflow-x-auto hide-scrollbar">
        <div className="flex gap-4 md:gap-8 min-w-max pr-6 md:pr-12 lg:pr-16">
          {products.map((product) => {
            const price = priceMap[product.id];
            return (
              <div key={product.id} className="w-[280px] md:w-[350px] lg:w-[400px] shrink-0 group">
                <Link href={`/products/${product.slug}`} className="block">
                  <div className="aspect-[3/4] relative overflow-hidden bg-samara-void1 mb-6 cursor-pointer">
                    {product.primary_image_url ? (
                      <img
                        src={product.primary_image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-[8000ms] ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-samara-void1" />
                    )}
                    
                    {product.is_new_arrival && (
                      <div className="absolute top-4 left-4 bg-samara-void/80 backdrop-blur-md border border-samara-gold/30 text-samara-gold px-3 py-1.5 text-[9px] font-sans tracking-[0.2em] uppercase flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" />
                        New
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-16 flex items-center justify-center bg-gradient-to-t from-samara-void/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                      <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory">Quick View</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-serif text-lg md:text-xl text-samara-ivory group-hover:text-samara-gold transition-colors duration-300 line-clamp-1 mb-2">
                      {product.name}
                    </h3>

                    {!price ? (
                      <div className="h-4 w-20 bg-samara-void1 animate-pulse" />
                    ) : (
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-sans tracking-widest text-samara-gold">
                          {formatPriceSync(price.displayPrice, price.currency)}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
