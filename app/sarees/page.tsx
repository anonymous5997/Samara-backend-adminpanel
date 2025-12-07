'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSareeProducts } from '@/lib/content';
import type { ProductWithImages } from '@/lib/content';
import { Star, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SareesPage() {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getSareeProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  return (
    <div className="bg-black text-white min-h-screen">
      <section className="py-20 bg-gradient-to-b from-black to-luxury-charcoal">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h1 className="font-serif text-6xl md:text-7xl font-bold mb-6 text-gold tracking-tighter">
              Sarees
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Explore our curated saree collection
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mb-12 pb-8 border-b border-gold/10">
            {['Fabric', 'Color', 'Occasion', 'Price', 'Sort'].map((filter) => (
              <button
                key={filter}
                className="px-6 py-2 rounded-full border-2 border-gold/20 bg-transparent hover:border-gold hover:bg-gold/10 font-serif text-gold transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  {filter}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20">
              <p className="text-gray-500">Loading sarees...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No sarees available at the moment.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
                {visibleProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <div className="group relative bg-black rounded-lg overflow-hidden border-2 border-gold/20 hover:border-gold hover:shadow-2xl hover:shadow-gold/30 transition-all duration-500">
                      <div className="aspect-[3/4] relative overflow-hidden bg-luxury-charcoal">
                        {product.primary_image_url ? (
                          <img
                            src={product.primary_image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            Product Image
                          </div>
                        )}
                        {product.is_bestseller && (
                          <div className="absolute top-3 left-3 bg-gold text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Star className="h-3 w-3 fill-current" />
                            {product.bestseller_badge_label}
                          </div>
                        )}
                        {product.is_new_arrival && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-gold to-gold-light text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Sparkles className="h-3 w-3" />
                            New
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-serif text-lg font-semibold mb-1 line-clamp-1 text-gold">
                          {product.name}
                        </h3>
                        {product.brand && (
                          <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
                        )}
                        <p className="text-xl font-bold text-gold">
                          ₹{product.base_price_inr.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {hasMore && (
                <div className="text-center">
                  <Button
                    onClick={() => setVisibleCount(prev => prev + 12)}
                    className="bg-gold-gradient hover:shadow-xl hover:shadow-gold/40 text-black font-semibold px-10 py-6 text-lg"
                  >
                    Show More Sarees
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
