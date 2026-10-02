'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductWithImages } from '@/lib/content';
import { resolveFinalPrice, ResolvedPrice } from '@/lib/resolve-product-price';
import { formatPriceSync } from '@/lib/currency-utils';
import { getUserRegion } from '@/lib/region/client';
import { getCurrencyRates } from '@/lib/currency/get-currency-rates';
import { useCart } from '@/lib/cart-context';
import { ArrowRight } from 'lucide-react';

export function MostLovedEditorial({ products }: { products: ProductWithImages[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [priceMap, setPriceMap] = useState<Record<string, ResolvedPrice>>({});
  const { currency } = useCart();
  const region = getUserRegion();

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

  const activeProduct = products[activeIndex];
  const price = priceMap[activeProduct.id];

  return (
    <section className="py-24 md:py-40 bg-samara-void overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-24">
          <div>
            <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold block mb-4">
              Curated Selection
            </span>
            <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-samara-ivory">
              Most <em className="italic font-light text-samara-gold">Loved</em>
            </h2>
          </div>
          <Link href="/shop?sort=bestseller" className="hidden md:flex items-center gap-3 group mt-8 md:mt-0">
            <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory border-b border-samara-ivory/30 pb-1 group-hover:border-samara-gold group-hover:text-samara-gold transition-colors">
              View All Bestsellers
            </span>
            <ArrowRight className="w-4 h-4 text-samara-ivory/50 group-hover:text-samara-gold group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Editorial Layout */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
          
          {/* Dominant Image Area */}
          <div className="w-full lg:w-3/5">
            <Link href={`/products/${activeProduct.slug}`}>
              <div className="aspect-[4/5] md:aspect-[3/4] relative overflow-hidden group cursor-pointer">
                {products.map((product, idx) => (
                  <div
                    key={product.id}
                    className={`absolute inset-0 transition-all duration-[1200ms] cubic-bezier(0.22, 0.61, 0.21, 1) ${
                      idx === activeIndex ? 'opacity-100 z-10' : 'opacity-0 scale-105 z-0'
                    }`}
                  >
                    {product.primary_image_url ? (
                      <img
                        src={product.primary_image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-[10000ms] ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-samara-void1" />
                    )}
                  </div>
                ))}
              </div>
            </Link>
          </div>

          {/* Typography & Navigation Area */}
          <div className="w-full lg:w-2/5 flex flex-col justify-center">
            
            {/* Number Nav */}
            {products.length > 1 && (
              <div className="flex items-center gap-6 mb-12">
                {products.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className="group flex flex-col gap-2"
                  >
                    <span className={`text-[11px] font-sans tracking-[0.2em] transition-colors ${
                      idx === activeIndex ? 'text-samara-gold' : 'text-samara-ivory/30 group-hover:text-samara-ivory/60'
                    }`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className={`w-8 h-[1px] transition-colors duration-500 ${
                      idx === activeIndex ? 'bg-samara-gold' : 'bg-samara-ivory/20 group-hover:bg-samara-ivory/40'
                    }`} />
                  </button>
                ))}
              </div>
            )}

            {/* Product Meta */}
            <div className="relative min-h-[200px]">
              {products.map((product, idx) => {
                const isActive = idx === activeIndex;
                const prodPrice = priceMap[product.id];
                return (
                  <div
                    key={product.id}
                    className={`absolute inset-0 transition-all duration-1000 ${
                      isActive ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-8 pointer-events-none'
                    }`}
                  >
                    <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl text-samara-ivory mb-6 leading-tight line-clamp-2 hover:text-samara-gold transition-colors">
                      <Link href={`/products/${product.slug}`}>{product.name}</Link>
                    </h3>
                    
                    {prodPrice && (
                      <p className="text-sm md:text-base font-sans tracking-[0.1em] text-samara-gold mb-10">
                        {formatPriceSync(prodPrice.displayPrice, prodPrice.currency)}
                      </p>
                    )}

                    <Link
                      href={`/products/${product.slug}`}
                      className="inline-flex items-center gap-3 border border-samara-gold/40 px-8 py-4 text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory hover:bg-samara-gold hover:text-samara-void transition-all duration-300"
                    >
                      Discover Piece
                    </Link>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
