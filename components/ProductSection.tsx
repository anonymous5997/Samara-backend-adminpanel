'use client';

import Link from 'next/link';
import { Heart, Star, Sparkles } from 'lucide-react';
import { ProductWithImages } from '@/lib/content';
import { useCart } from '@/lib/cart-context';
import { useEffect, useState } from 'react';
import { getCurrencyRates, convertPriceSync, formatPriceSync } from '@/lib/currency-utils';

interface ProductSectionProps {
  products: ProductWithImages[];
  showBestseller?: boolean;
  showNew?: boolean;
}

export function ProductSection({ products, showBestseller = false, showNew = false }: ProductSectionProps) {
  const { currency } = useCart();
  const [rates, setRates] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const fetchRates = async () => {
      const fetchedRates = await getCurrencyRates();
      setRates(fetchedRates);
    };
    fetchRates();
  }, []);

  const getPrice = (basePrice: number) => {
    const converted = convertPriceSync(basePrice, currency, rates);
    return formatPriceSync(converted, currency);
  };

  const getOriginalPrice = (basePrice: number) => {
    const originalInr = Math.round(basePrice * 1.4);
    const converted = convertPriceSync(originalInr, currency, rates);
    return formatPriceSync(converted, currency);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
      {products.map((product, idx) => (
        <Link key={product.id} href={`/products/${product.slug}`}>
          <div className="group relative bg-gradient-to-br from-[#0d0d0d] to-[#000000] rounded-2xl overflow-hidden border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/50 transition-all duration-500 hover:-translate-y-2">
            <div className="aspect-[3/4] relative overflow-hidden bg-[#111111]">
              {product.primary_image_url ? (
                <img
                  src={product.primary_image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#111111] to-[#0b0b0b]">
                  <span className="text-gray-700 font-serif text-sm">Product Image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {showBestseller && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/50">
                  <Star className="h-3 w-3 fill-current" />
                  Bestseller
                </div>
              )}

              {showNew && idx < 2 && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/50">
                  <Sparkles className="h-3 w-3 fill-current" />
                  New
                </div>
              )}

              <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
                <Heart className="h-4 w-4 text-[#D4AF37]" />
              </button>
            </div>
            <div className="p-4 bg-gradient-to-b from-[#0d0d0d] to-[#000000]">
              <h3 className="font-serif text-base md:text-lg font-semibold mb-1 line-clamp-1 text-white group-hover:text-[#D4AF37] transition-colors">
                {product.name}
              </h3>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-lg md:text-xl font-bold text-[#D4AF37]">
                  {getPrice(product.base_price_inr)}
                </p>
                <p className="text-sm text-gray-600 line-through">
                  {getOriginalPrice(product.base_price_inr)}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
