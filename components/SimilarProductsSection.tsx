'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';

interface SimilarProduct {
  id: string;
  name: string;
  slug: string;
  base_price_inr: number;
  primary_image_url: string | null;
}

interface SimilarProductsSectionProps {
  products: SimilarProduct[];
}

export function SimilarProductsSection({ products }: SimilarProductsSectionProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-black via-[#050505] to-black">
      <div className="container mx-auto px-4 md:px-8">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#D4AF37] mb-8 text-center">
          Similar Sarees You May Love
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {products.map((product) => (
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
                      ₹{product.base_price_inr.toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-gray-600 line-through">
                      ₹{Math.round(product.base_price_inr * 1.15).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
